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
	r.ParseMultipartForm(50 << 20)
	file, header, err := r.FormFile("file")
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "Failed to read file from request")
		return
	}
	defer file.Close()

	os.MkdirAll("uploads", os.ModePerm)

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

	if decodedName, err := url.PathUnescape(fileName); err == nil {
		fileName = decodedName
	}

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
	
	if ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif" || ext == ".webp" {
		http.ServeFile(w, r, validFilePath)
		return
	}

	// 🔒 1. ตรวจสอบ Token (ป้องกันคนนอก)
	token := extractTokenFromReq(r)
	if token == "" {
		h.writeError(w, http.StatusUnauthorized, "Unauthorized: No token provided")
		return
	}
	if _, err := h.parseToken(token); err != nil {
		h.writeError(w, http.StatusUnauthorized, "Unauthorized: Invalid token")
		return
	}

	// 🔒 2. ตรวจจับการดาวน์โหลดทางอ้อม (ป้องกัน IDM และการก๊อป URL ไปเปิดตรงๆ)
	// เบราว์เซอร์ปกติที่โหลดผ่าน <video src="..."> จะส่ง Sec-Fetch-Dest: video
	if ext == ".mp4" || ext == ".webm" {
		dest := r.Header.Get("Sec-Fetch-Dest")
		if dest != "video" && dest != "" {
			h.writeError(w, http.StatusForbidden, "Direct downloading is not allowed")
			return
		}
	}

	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
	w.Header().Set("Pragma", "no-cache")

	http.ServeFile(w, r, validFilePath)
}