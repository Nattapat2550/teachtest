package handlers

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) UploadFile(w http.ResponseWriter, r *http.Request) {
	// จำกัดขนาดไฟล์ที่ 50MB
	r.ParseMultipartForm(50 << 20)

	file, header, err := r.FormFile("file")
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "Failed to read file from request")
		return
	}
	defer file.Close()

	// สร้างโฟลเดอร์ถ้ายังไม่มี
	os.MkdirAll("uploads", os.ModePerm)

	// ทำความสะอาดชื่อไฟล์ ป้องกันปัญหาเว้นวรรค
	cleanName := header.Filename
	cleanName = strings.ReplaceAll(cleanName, " ", "_")
	cleanName = strings.ReplaceAll(cleanName, "%20", "_")
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(cleanName))
	savePath := filepath.Join("uploads", filename)

	out, err := os.Create(savePath)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to save file on server")
		return
	}
	defer out.Close()

	io.Copy(out, file)

	fileUrl := "/uploads/" + filename
	WriteJSON(w, http.StatusOK, map[string]string{"url": fileUrl})
}

func (h *Handler) ServeProtectedFile(w http.ResponseWriter, r *http.Request) {
	fileName := chi.URLParam(r, "file")

	// 1. ถอดรหัส URL (ป้องกัน 404 จากการเข้ารหัสอักขระพิเศษ)
	if decodedName, err := url.PathUnescape(fileName); err == nil {
		fileName = decodedName
	}

	// 2. ลองค้นหาไฟล์ในหลายๆ รูปแบบ
	pathsToTry := []string{
		filepath.Join("uploads", fileName),
		filepath.Join("uploads", strings.ReplaceAll(fileName, " ", "_")),
		filepath.Join("uploads", strings.ReplaceAll(fileName, "_", " ")),
	}

	var validFilePath string
	for _, p := range pathsToTry {
		if _, err := os.Stat(p); err == nil {
			validFilePath = p
			break
		}
	}

	if validFilePath == "" {
		h.writeError(w, http.StatusNotFound, "File not found")
		return
	}

	ext := strings.ToLower(filepath.Ext(validFilePath))

	// 3. ปล่อยผ่านไฟล์รูปภาพปกติ (เข้าถึงได้เลย)
	if ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif" || ext == ".webp" {
		http.ServeFile(w, r, validFilePath)
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
		http.ServeFile(w, r, validFilePath)
		return // คืนค่าทันที ไม่ให้รันไปบล็อกด้านล่าง
	}

	// 6. 🌟 เพิ่ม Fallback สำหรับไฟล์ประเภทเอกสาร (.pdf, .doc, .zip ฯลฯ)
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	http.ServeFile(w, r, validFilePath)
}