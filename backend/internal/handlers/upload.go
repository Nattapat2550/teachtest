package handlers

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"cloud.google.com/go/storage"
	firebase "firebase.google.com/go/v4"
	"github.com/go-chi/chi/v5"
	"google.golang.org/api/option"
)

// ตัวแปร Global สำหรับเก็บ Connection ของ Firebase Bucket
var storageBucket *storage.BucketHandle

// initFirebase ฟังก์ชันสำหรับเชื่อมต่อ Firebase
func initFirebase() error {
	if storageBucket != nil {
		return nil // หากเชื่อมต่อแล้วไม่ต้องทำซ้ำ
	}

	ctx := context.Background()

	bucketName := os.Getenv("FIREBASE_STORAGE_BUCKET")
	if bucketName == "" {
		return fmt.Errorf("FIREBASE_STORAGE_BUCKET is not set in environment variables")
	}

	var opt option.ClientOption

	// 1. ลองอ่านจาก Environment Variable แบบ String ก่อน (ใช้ตอน Deploy บน Render)
	credJSON := os.Getenv("FIREBASE_CREDENTIALS_JSON")
	if credJSON != "" {
		opt = option.WithCredentialsJSON([]byte(credJSON))
	} else {
		// 2. ถ้าไม่มี ให้ใช้ไฟล์ .json ปกติ (ใช้ตอนรันพัฒนาในเครื่อง Local)
		credPath := os.Getenv("FIREBASE_CREDENTIALS")
		if credPath == "" {
			credPath = "firebase-adminsdk.json" // Fallback default
		}
		opt = option.WithCredentialsFile(credPath)
	}

	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		return fmt.Errorf("error initializing firebase app: %v", err)
	}

	client, err := app.Storage(ctx)
	if err != nil {
		return fmt.Errorf("error getting storage client: %v", err)
	}

	bucket, err := client.Bucket(bucketName)
	if err != nil {
		return fmt.Errorf("error getting bucket: %v", err)
	}

	storageBucket = bucket
	return nil
}

func (h *Handler) UploadFile(w http.ResponseWriter, r *http.Request) {
	// จำกัดขนาดไฟล์ที่ 50MB
	r.ParseMultipartForm(50 << 20)

	file, header, err := r.FormFile("file")
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "Failed to read file from request")
		return
	}
	defer file.Close()

	// Initialize Firebase ก่อนอัปโหลด
	if err := initFirebase(); err != nil {
		fmt.Println("❌ Firebase Init Error:", err)
		h.writeError(w, http.StatusInternalServerError, "Failed to connect to cloud storage")
		return
	}

	// ทำความสะอาดชื่อไฟล์ ป้องกันปัญหาเว้นวรรค
	cleanName := header.Filename
	cleanName = strings.ReplaceAll(cleanName, " ", "_")
	cleanName = strings.ReplaceAll(cleanName, "%20", "_")
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(cleanName))

	// สร้าง Writer เพื่อเขียนไฟล์ลง Firebase
	ctx := context.Background()
	wc := storageBucket.Object(filename).NewWriter(ctx)
	wc.ContentType = header.Header.Get("Content-Type")

	// สตรีมไฟล์ไปที่ Firebase
	if _, err := io.Copy(wc, file); err != nil {
		fmt.Println("❌ Firebase Init Error:", err)
		h.writeError(w, http.StatusInternalServerError, "Failed to upload file to cloud storage")
		return
	}

	if err := wc.Close(); err != nil {
		fmt.Println("❌ Firebase Init Error:", err)
		h.writeError(w, http.StatusInternalServerError, "Failed to finalize file upload")
		return
	}

	// ใช้ Path เดิมเพื่อให้ Frontend ยังคงสามารถดึงไฟล์ผ่าน Route ป้องกันของระบบเราได้
	fileUrl := "/uploads/" + filename
	WriteJSON(w, http.StatusOK, map[string]string{"url": fileUrl})
}

func (h *Handler) ServeProtectedFile(w http.ResponseWriter, r *http.Request) {
	fileName := chi.URLParam(r, "file")

	// 1. ถอดรหัส URL (ป้องกัน 404 จากการเข้ารหัสอักขระพิเศษ)
	if decodedName, err := url.PathUnescape(fileName); err == nil {
		fileName = decodedName
	}

	// Initialize Firebase ก่อนดึงไฟล์
	if err := initFirebase(); err != nil {
		h.writeError(w, http.StatusInternalServerError, "Storage service unavailable")
		return
	}

	ctx := context.Background()
	
	// 2. ลองค้นหาไฟล์ใน Firebase (เช็คว่ามีอยู่จริงไหม)
	var obj *storage.ObjectHandle
	var attrs *storage.ObjectAttrs

	pathsToTry := []string{
		fileName,
		strings.ReplaceAll(fileName, " ", "_"),
		strings.ReplaceAll(fileName, "_", " "),
	}

	var found bool
	for _, p := range pathsToTry {
		tempObj := storageBucket.Object(p)
		tempAttrs, err := tempObj.Attrs(ctx)
		if err == nil {
			obj = tempObj
			attrs = tempAttrs
			found = true
			fileName = p
			break
		}
	}

	if !found {
		h.writeError(w, http.StatusNotFound, "File not found")
		return
	}

	ext := strings.ToLower(filepath.Ext(fileName))

	// 3. ปล่อยผ่านไฟล์รูปภาพปกติ (เข้าถึงได้เลย)
	if ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif" || ext == ".webp" {
		streamFirebaseObject(w, r, obj, attrs)
		return
	}

	// 4. ไฟล์ประเภทอื่นต้องตรวจ Token (ระบบคอร์สเรียน)
	token := extractTokenFromReq(r)
	if token == "" {
		h.writeError(w, http.StatusUnauthorized, "Unauthorized: No token provided")
		return
	}

	if _, err := h.parseToken(token); err != nil {
		h.writeError(w, http.StatusUnauthorized, "Unauthorized: Invalid token")
		return
	}

	// 5. ป้องกันการดูดไฟล์วิดีโอ (Anti-Hotlinking)
	if ext == ".mp4" || ext == ".webm" {
		referer := r.Header.Get("Referer")
		frontendURL := strings.TrimRight(h.Cfg.FrontendURL, "/")

		// 5.1 ตรวจสอบ Referer
		if referer == "" || !strings.HasPrefix(referer, frontendURL) {
			h.writeError(w, http.StatusForbidden, "Access Denied: Direct downloading or using external downloaders is strictly blocked.")
			return
		}

		// 5.2 ป้องกันการเข้าถึงทาง URL โดยตรง
		fetchMode := r.Header.Get("Sec-Fetch-Mode")
		if fetchMode == "navigate" {
			h.writeError(w, http.StatusForbidden, "Access Denied: Direct access is not allowed.")
			return
		}

		w.Header().Set("Accept-Ranges", "bytes")
		w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		streamFirebaseObject(w, r, obj, attrs)
		return
	}

	// 6. 🌟 เพิ่ม Fallback สำหรับไฟล์ประเภทเอกสาร (.pdf, .doc, .zip ฯลฯ)
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	
	// ตั้งชื่อไฟล์สำหรับดาวน์โหลด
	w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", filepath.Base(fileName)))
	streamFirebaseObject(w, r, obj, attrs)
}

// Helper ฟังก์ชันสำหรับสตรีมไฟล์จาก Firebase ส่งให้ Client
func streamFirebaseObject(w http.ResponseWriter, r *http.Request, obj *storage.ObjectHandle, attrs *storage.ObjectAttrs) {
	ctx := context.Background()
	rc, err := obj.NewReader(ctx)
	if err != nil {
		http.Error(w, "Failed to read file from storage", http.StatusInternalServerError)
		return
	}
	defer rc.Close()

	// เซ็ต Headers พื้นฐาน
	w.Header().Set("Content-Type", attrs.ContentType)
	w.Header().Set("Content-Length", fmt.Sprintf("%d", attrs.Size))

	// คัดลอกข้อมูลจาก Firebase ส่งไปยัง HTTP Response โดยตรง
	io.Copy(w, rc)
}