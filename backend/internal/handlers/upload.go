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
	// รองรับไฟล์ขนาดสูงสุด 50MB
	r.ParseMultipartForm(50 << 20)
	file, header, err := r.FormFile("file")
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "Failed to read file from request")
		return
	}
	defer file.Close()

	os.MkdirAll("uploads", os.ModePerm)

	// ทำความสะอาดชื่อไฟล์ แปลงเว้นวรรคและ %20 เป็น _ เพื่อความปลอดภัยขั้นสุด
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

	// 1. ถอดรหัส URL (เผื่อเบราว์เซอร์ส่ง %20 มาแทนเว้นวรรค)
	if decodedName, err := url.PathUnescape(fileName); err == nil {
		fileName = decodedName
	}

	// 2. ค้นหาไฟล์แบบยืดหยุ่น (แก้บัค 404 สำหรับไฟล์เก่าที่มีเว้นวรรค และไฟล์ใหม่ที่เป็น _)
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

	// ถ้าพยายามหาทุกรูปแบบแล้วยังไม่เจอ
	if validFilePath == "" {
		h.writeError(w, http.StatusNotFound, "File not found")
		return
	}

	ext := strings.ToLower(filepath.Ext(validFilePath))
	
	// 3. ปล่อยผ่านไฟล์รูปภาพให้เข้าถึงได้ทันที
	if ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif" || ext == ".webp" {
		http.ServeFile(w, r, validFilePath)
		return
	}

	// 4. ตรวจสอบ Token สำหรับวิดีโอและเอกสาร
	token := extractTokenFromReq(r)
	if token == "" {
		h.writeError(w, http.StatusUnauthorized, "Unauthorized: No token provided")
		return
	}

	if _, err := h.parseToken(token); err != nil {
		h.writeError(w, http.StatusUnauthorized, "Unauthorized: Invalid token")
		return
	}

	// 5. เซ็ต Header ให้เบราว์เซอร์รู้ว่าไฟล์นี้สามารถ กรอวิดีโอ (Seek) ไปข้างหน้า-หลังได้
	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
	w.Header().Set("Pragma", "no-cache")

	http.ServeFile(w, r, validFilePath)
}