package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
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