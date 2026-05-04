package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) TutorGetPackages(w http.ResponseWriter, r *http.Request) {
	u := GetUser(r)
	query := `SELECT id, title, description, price, cover_image, course_ids, created_at FROM course_packages`
	var rows *sql.Rows
	var err error

	if u.Role == "admin" {
		rows, err = h.TeachDB.Query(query + " ORDER BY created_at DESC")
	} else {
		rows, err = h.TeachDB.Query(query+" WHERE tutor_id = $1 ORDER BY created_at DESC", GetUserIDStr(u))
	}

	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "DB Error")
		return
	}
	defer rows.Close()

	var pkgs []map[string]any
	for rows.Next() {
		var id, title string
		var desc, cover *string
		var price float64
		var cJSON []byte
		var ca time.Time
		if err := rows.Scan(&id, &title, &desc, &price, &cover, &cJSON, &ca); err == nil {
			var courseIds any
			json.Unmarshal(cJSON, &courseIds)
			pkgs = append(pkgs, map[string]any{"id": id, "title": title, "description": desc, "price": price, "cover_image": cover, "course_ids": courseIds, "created_at": ca})
		}
	}
	if pkgs == nil {
		pkgs = []map[string]any{}
	}
	WriteJSON(w, http.StatusOK, pkgs)
}

func (h *Handler) TutorCreatePackage(w http.ResponseWriter, r *http.Request) {
	u := GetUser(r)
	var req struct {
		Title       string   `json:"title"`
		Description string   `json:"description"`
		Price       float64  `json:"price"`
		CoverImage  string   `json:"cover_image"`
		CourseIds   []string `json:"course_ids"`
	}
	if err := ReadJSON(r, &req); err != nil {
		return
	}

	idsJSON, _ := json.Marshal(req.CourseIds)
	_, err := h.TeachDB.Exec(`INSERT INTO course_packages (tutor_id, title, description, price, cover_image, course_ids) VALUES ($1, $2, $3, $4, $5, $6)`, GetUserIDStr(u), req.Title, req.Description, req.Price, req.CoverImage, string(idsJSON))
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to create package")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Package created"})
}

func (h *Handler) TutorUpdatePackage(w http.ResponseWriter, r *http.Request) {
	pkgId := chi.URLParam(r, "packageId")
	u := GetUser(r)
	var req struct {
		Title       string   `json:"title"`
		Description string   `json:"description"`
		Price       float64  `json:"price"`
		CoverImage  string   `json:"cover_image"`
		CourseIds   []string `json:"course_ids"`
	}
	if err := ReadJSON(r, &req); err != nil {
		return
	}
	idsJSON, _ := json.Marshal(req.CourseIds)

	var err error
	if u.Role == "admin" {
		_, err = h.TeachDB.Exec(`UPDATE course_packages SET title=$1, description=$2, price=$3, cover_image=$4, course_ids=$5 WHERE id=$6`, req.Title, req.Description, req.Price, req.CoverImage, string(idsJSON), pkgId)
	} else {
		_, err = h.TeachDB.Exec(`UPDATE course_packages SET title=$1, description=$2, price=$3, cover_image=$4, course_ids=$5 WHERE id=$6 AND tutor_id=$7`, req.Title, req.Description, req.Price, req.CoverImage, string(idsJSON), pkgId, GetUserIDStr(u))
	}

	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to update package")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Package updated"})
}

func (h *Handler) TutorDeletePackage(w http.ResponseWriter, r *http.Request) {
	pkgId := chi.URLParam(r, "packageId")
	u := GetUser(r)
	var err error
	if u.Role == "admin" {
		_, err = h.TeachDB.Exec(`DELETE FROM course_packages WHERE id=$1`, pkgId)
	} else {
		_, err = h.TeachDB.Exec(`DELETE FROM course_packages WHERE id=$1 AND tutor_id=$2`, pkgId, GetUserIDStr(u))
	}
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to delete package")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Package deleted"})
}