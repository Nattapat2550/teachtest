package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) UploadFile(w http.ResponseWriter, r *http.Request) {
	// รับไฟล์สูงสุด 50MB
	r.ParseMultipartForm(50 << 20)

	file, header, err := r.FormFile("file")
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "Failed to read file from request")
		return
	}
	defer file.Close()

	// สร้างโฟลเดอร์ uploads หากยังไม่มี
	os.MkdirAll("uploads", os.ModePerm)

	// ตั้งชื่อไฟล์ด้วย Timestamp ป้องกันชื่อซ้ำ
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(header.Filename))
	savePath := filepath.Join("uploads", filename)
	
	out, err := os.Create(savePath)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to save file on server")
		return
	}
	defer out.Close()
	io.Copy(out, file)

	// ส่ง URL กลับให้ Frontend
	fileUrl := "/uploads/" + filename
	WriteJSON(w, http.StatusOK, map[string]string{"url": fileUrl})
}

func (h *Handler) ServeProtectedFile(w http.ResponseWriter, r *http.Request) {
	fileName := chi.URLParam(r, "file")
	filePath := filepath.Join("uploads", fileName)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		h.writeError(w, http.StatusNotFound, "File not found")
		return
	}

	// อนุญาตให้โหลดไฟล์รูปภาพสาธารณะได้ (เพื่อไม่ให้หน้าแรกและรูปปกพัง)
	ext := strings.ToLower(filepath.Ext(fileName))
	if ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif" || ext == ".webp" {
		http.ServeFile(w, r, filePath)
		return
	}

	// หากไม่ใช่รูปภาพ (เช่น mp4, pdf, zip) ต้องตรวจสอบ Token การล็อกอิน
	token := extractTokenFromReq(r)
	if token == "" {
		h.writeError(w, http.StatusUnauthorized, "Unauthorized: กรุณาเข้าสู่ระบบก่อนดูเนื้อหา")
		return
	}
	_, err := h.parseToken(token)
	if err != nil {
		h.writeError(w, http.StatusUnauthorized, "Unauthorized: Token ไม่ถูกต้อง")
		return
	}

	// สั่งปิดการ Cache ของไฟล์วิดีโอในเบราว์เซอร์เพื่อความปลอดภัยอีกชั้น
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
	w.Header().Set("Pragma", "no-cache")

	http.ServeFile(w, r, filePath)
}