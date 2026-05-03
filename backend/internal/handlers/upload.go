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
	// รองรับไฟล์ขนาดสูงสุด 50MB (ปรับเพิ่มลดได้)
	r.ParseMultipartForm(50 << 20) 

	file, header, err := r.FormFile("file")
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "ไม่พบไฟล์ที่อัปโหลด")
		return
	}
	defer file.Close()

	// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
	os.MkdirAll("uploads", os.ModePerm)

	// ตั้งชื่อไฟล์ใหม่ด้วย Timestamp กันชื่อซ้ำ
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(header.Filename))
	savePath := filepath.Join("uploads", filename)

	out, err := os.Create(savePath)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "ไม่สามารถบันทึกไฟล์ได้")
		return
	}
	defer out.Close()
	io.Copy(out, file)

	// ส่ง URL ของไฟล์กลับไปให้ Frontend
	fileUrl := "/uploads/" + filename
	WriteJSON(w, http.StatusOK, map[string]string{"url": fileUrl})
}