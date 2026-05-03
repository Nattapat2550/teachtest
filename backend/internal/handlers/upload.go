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
	// รองรับไฟล์ขนาดสูงสุด 50MB (ปรับได้)
	r.ParseMultipartForm(50 << 20)
	file, header, err := r.FormFile("file")
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "Failed to read file from request")
		return
	}
	defer file.Close()

	// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
	os.MkdirAll("uploads", os.ModePerm)

	// สร้างชื่อไฟล์ใหม่ ป้องกันการซ้ำและปัญหา URL (เปลี่ยนเว้นวรรคเป็น _)
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(header.Filename))
	filename = strings.ReplaceAll(filename, " ", "_")
	filename = strings.ReplaceAll(filename, "%20", "_")

	savePath := filepath.Join("uploads", filename)
	out, err := os.Create(savePath)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to save file on server")
		return
	}
	defer out.Close()

	io.Copy(out, file)

	// คืนค่า URL Relative ให้ Frontend นำไปใช้งาน
	fileUrl := "/uploads/" + filename
	WriteJSON(w, http.StatusOK, map[string]string{"url": fileUrl})
}

func (h *Handler) ServeProtectedFile(w http.ResponseWriter, r *http.Request) {
	fileName := chi.URLParam(r, "file")
	
	// Decode URL กรณีที่มีการแปลง %20 กลับเป็น Space ป้องกันการหาไฟล์ไม่เจอ
	if decodedName, err := url.PathUnescape(fileName); err == nil {
		fileName = decodedName
	}

	filePath := filepath.Join("uploads", fileName)

	// ตรวจสอบว่ามีไฟล์อยู่จริงหรือไม่
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		h.writeError(w, http.StatusNotFound, "File not found")
		return
	}

	ext := strings.ToLower(filepath.Ext(fileName))
	// ให้รูปภาพเข้าถึงได้สาธารณะ
	if ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif" || ext == ".webp" {
		http.ServeFile(w, r, filePath)
		return
	}

	// สำหรับไฟล์เอกสารและวิดีโอ (mp4, pdf, zip) ต้องตรวจสอบ Token
	token := extractTokenFromReq(r)
	if token == "" {
		h.writeError(w, http.StatusUnauthorized, "Unauthorized: No token provided")
		return
	}

	_, err := h.parseToken(token)
	if err != nil {
		h.writeError(w, http.StatusUnauthorized, "Unauthorized: Invalid token")
		return
	}

	// ไม่ให้ Browser แคชไฟล์เหล่านี้ เพื่อความปลอดภัย
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
	w.Header().Set("Pragma", "no-cache")

	http.ServeFile(w, r, filePath)
}