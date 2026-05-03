package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) TutorGetMyCourses(w http.ResponseWriter, r *http.Request) {
	u := GetUser(r)
	tutorId := GetUserIDStr(u)

	query := `
		SELECT 
			c.id, c.title, c.description, c.price, c.cover_image, c.is_published, c.created_at,
			COALESCE(
				(SELECT json_agg(
					json_build_object(
						'id', p.id, 'title', p.title, 'sort_order', p.sort_order,
						'items', COALESCE((
							SELECT json_agg(
								json_build_object('id', pi.id, 'title', pi.title, 'item_type', pi.item_type, 'content_url', pi.content_url, 'content_data', pi.content_data, 'sort_order', pi.sort_order) ORDER BY pi.sort_order
							) FROM playlist_items pi WHERE pi.playlist_id = p.id
						), '[]'::json)
					) ORDER BY p.sort_order
				) FROM playlists p WHERE p.course_id = c.id),
				'[]'::json
			) as playlists
		FROM courses c
	`

	var rows *sql.Rows
	var err error

	if u.Role == "admin" {
		query += " ORDER BY c.created_at DESC"
		rows, err = h.TeachDB.Query(query)
	} else {
		query += " WHERE c.tutor_id = $1 ORDER BY c.created_at DESC"
		rows, err = h.TeachDB.Query(query, tutorId)
	}

	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "DB Error")
		return
	}
	defer rows.Close()

	var courses []map[string]any
	for rows.Next() {
		var id, title string
		var desc, cover *string
		var price float64
		var isPub bool
		var createdAt time.Time
		var plJSON []byte

		if err := rows.Scan(&id, &title, &desc, &price, &cover, &isPub, &createdAt, &plJSON); err == nil {
			var playlists any
			json.Unmarshal(plJSON, &playlists)
			courses = append(courses, map[string]any{
				"id": id, "title": title, "description": desc, "price": price,
				"cover_image": cover, "is_published": isPub, "created_at": createdAt.Format(time.RFC3339),
				"playlists": playlists,
			})
		}
	}
	if courses == nil { courses = []map[string]any{} }
	WriteJSON(w, http.StatusOK, courses)
}

func (h *Handler) TutorCreateCourse(w http.ResponseWriter, r *http.Request) {
	u := GetUser(r)
	var req struct {
		Title       string  `json:"title"`
		Description string  `json:"description"`
		Price       float64 `json:"price"`
		CoverImage  string  `json:"cover_image"`
	}
	if err := ReadJSON(r, &req); err != nil { return }

	var id string
	err := h.TeachDB.QueryRow(`INSERT INTO courses (tutor_id, title, description, price, cover_image, is_published) VALUES ($1, $2, $3, $4, $5, true) RETURNING id`, GetUserIDStr(u), req.Title, req.Description, req.Price, req.CoverImage).Scan(&id)
	if err != nil { h.writeError(w, http.StatusInternalServerError, "Failed to create course"); return }
	WriteJSON(w, http.StatusCreated, map[string]string{"id": id, "message": "Course created"})
}

func (h *Handler) TutorUpdateCourse(w http.ResponseWriter, r *http.Request) {
	courseId := chi.URLParam(r, "courseId")
	u := GetUser(r)
	var req struct {
		Title       string  `json:"title"`
		Description string  `json:"description"`
		Price       float64 `json:"price"`
		CoverImage  string  `json:"cover_image"`
	}
	if err := ReadJSON(r, &req); err != nil { return }

	var err error
	if u.Role == "admin" {
		_, err = h.TeachDB.Exec(`UPDATE courses SET title=$1, description=$2, price=$3, cover_image=$4 WHERE id=$5`, req.Title, req.Description, req.Price, req.CoverImage, courseId)
	} else {
		_, err = h.TeachDB.Exec(`UPDATE courses SET title=$1, description=$2, price=$3, cover_image=$4 WHERE id=$5 AND tutor_id=$6`, req.Title, req.Description, req.Price, req.CoverImage, courseId, GetUserIDStr(u))
	}

	if err != nil { h.writeError(w, http.StatusInternalServerError, "Failed to update course"); return }
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Course updated"})
}

func (h *Handler) TutorDeleteCourse(w http.ResponseWriter, r *http.Request) {
	courseId := chi.URLParam(r, "courseId")
	u := GetUser(r)
	
	var err error
	if u.Role == "admin" {
		_, err = h.TeachDB.Exec(`DELETE FROM courses WHERE id=$1`, courseId)
	} else {
		_, err = h.TeachDB.Exec(`DELETE FROM courses WHERE id=$1 AND tutor_id=$2`, courseId, GetUserIDStr(u))
	}

	if err != nil { h.writeError(w, http.StatusInternalServerError, "Failed to delete course"); return }
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Course deleted"})
}

// Packages
func (h *Handler) TutorGetPackages(w http.ResponseWriter, r *http.Request) {
	u := GetUser(r)
	query := `SELECT id, title, description, price, cover_image, course_ids, created_at FROM course_packages`
	var rows *sql.Rows
	var err error
	
	if u.Role == "admin" {
		rows, err = h.TeachDB.Query(query + " ORDER BY created_at DESC")
	} else {
		rows, err = h.TeachDB.Query(query + " WHERE tutor_id = $1 ORDER BY created_at DESC", GetUserIDStr(u))
	}
	
	if err != nil { h.writeError(w, http.StatusInternalServerError, "DB Error"); return }
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
	if pkgs == nil { pkgs = []map[string]any{} }
	WriteJSON(w, http.StatusOK, pkgs)
}

func (h *Handler) TutorCreatePackage(w http.ResponseWriter, r *http.Request) {
	u := GetUser(r)
	var req struct {
		Title string `json:"title"`
		Description string `json:"description"`
		Price float64 `json:"price"`
		CoverImage string `json:"cover_image"`
		CourseIds []string `json:"course_ids"`
	}
	if err := ReadJSON(r, &req); err != nil { return }
	
	idsJSON, _ := json.Marshal(req.CourseIds)
	_, err := h.TeachDB.Exec(`INSERT INTO course_packages (tutor_id, title, description, price, cover_image, course_ids) VALUES ($1, $2, $3, $4, $5, $6)`, GetUserIDStr(u), req.Title, req.Description, req.Price, req.CoverImage, string(idsJSON))
	if err != nil { h.writeError(w, http.StatusInternalServerError, "Failed to create package"); return }
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Package created"})
}

func (h *Handler) TutorUpdatePackage(w http.ResponseWriter, r *http.Request) {
	pkgId := chi.URLParam(r, "packageId")
	u := GetUser(r)
	var req struct {
		Title string `json:"title"`
		Description string `json:"description"`
		Price float64 `json:"price"`
		CoverImage string `json:"cover_image"`
		CourseIds []string `json:"course_ids"`
	}
	if err := ReadJSON(r, &req); err != nil { return }
	idsJSON, _ := json.Marshal(req.CourseIds)

	var err error
	if u.Role == "admin" {
		_, err = h.TeachDB.Exec(`UPDATE course_packages SET title=$1, description=$2, price=$3, cover_image=$4, course_ids=$5 WHERE id=$6`, req.Title, req.Description, req.Price, req.CoverImage, string(idsJSON), pkgId)
	} else {
		_, err = h.TeachDB.Exec(`UPDATE course_packages SET title=$1, description=$2, price=$3, cover_image=$4, course_ids=$5 WHERE id=$6 AND tutor_id=$7`, req.Title, req.Description, req.Price, req.CoverImage, string(idsJSON), pkgId, GetUserIDStr(u))
	}

	if err != nil { h.writeError(w, http.StatusInternalServerError, "Failed to update package"); return }
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
	if err != nil { h.writeError(w, http.StatusInternalServerError, "Failed to delete package"); return }
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Package deleted"})
}

// Promos
func (h *Handler) TutorGetPromoCodes(w http.ResponseWriter, r *http.Request) {
	courseId := chi.URLParam(r, "courseId")
	rows, err := h.TeachDB.Query(`
		SELECT pc.id, pc.code, pc.discount_amount, pc.max_uses, pc.created_at,
			COALESCE((SELECT json_agg(json_build_object('student_id', pcu.student_id, 'used_at', pcu.used_at)) FROM promo_code_uses pcu WHERE pcu.promo_code_id = pc.id), '[]'::json) as uses
		FROM promo_codes pc WHERE pc.course_id = $1 ORDER BY pc.created_at DESC
	`, courseId)
	if err != nil { h.writeError(w, http.StatusInternalServerError, "DB Error"); return }
	defer rows.Close()

	var promos []map[string]any
	for rows.Next() {
		var id, code string
		var discount float64
		var maxUses int
		var createdAt time.Time
		var usesJSON []byte
		if err := rows.Scan(&id, &code, &discount, &maxUses, &createdAt, &usesJSON); err == nil {
			var uses any
			json.Unmarshal(usesJSON, &uses)
			promos = append(promos, map[string]any{"id": id, "code": code, "discount_amount": discount, "max_uses": maxUses, "created_at": createdAt.Format(time.RFC3339), "uses": uses})
		}
	}
	if promos == nil { promos = []map[string]any{} }
	WriteJSON(w, http.StatusOK, promos)
}

func (h *Handler) TutorCreatePromoCode(w http.ResponseWriter, r *http.Request) {
	courseId := chi.URLParam(r, "courseId")
	var req struct {
		Code           string  `json:"code"`
		DiscountAmount float64 `json:"discount_amount"`
		MaxUses        int     `json:"max_uses"`
	}
	if err := ReadJSON(r, &req); err != nil { return }

	_, err := h.TeachDB.Exec(`INSERT INTO promo_codes (course_id, code, discount_amount, max_uses) VALUES ($1, $2, $3, $4)`, courseId, req.Code, req.DiscountAmount, req.MaxUses)
	if err != nil { h.writeError(w, http.StatusInternalServerError, "Promo code error"); return }
	WriteJSON(w, http.StatusCreated, map[string]string{"message": "Promo created"})
}

func (h *Handler) TutorUpdatePromoCode(w http.ResponseWriter, r *http.Request) {
	promoId := chi.URLParam(r, "promoId")
	var req struct {
		Code string `json:"code"`
		DiscountAmount float64 `json:"discount_amount"`
		MaxUses int `json:"max_uses"`
	}
	if err := ReadJSON(r, &req); err != nil { return }

	_, err := h.TeachDB.Exec(`UPDATE promo_codes SET code=$1, discount_amount=$2, max_uses=$3 WHERE id=$4`, req.Code, req.DiscountAmount, req.MaxUses, promoId)
	if err != nil { h.writeError(w, http.StatusInternalServerError, "Update failed"); return }
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Updated"})
}

func (h *Handler) TutorDeletePromoCode(w http.ResponseWriter, r *http.Request) {
	promoId := chi.URLParam(r, "promoId")
	_, err := h.TeachDB.Exec(`DELETE FROM promo_codes WHERE id=$1`, promoId)
	if err != nil { h.writeError(w, http.StatusInternalServerError, "Delete failed"); return }
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Deleted"})
}

// Global Promos (Admin Only)
func (h *Handler) AdminGetGlobalPromos(w http.ResponseWriter, r *http.Request) {
	rows, err := h.TeachDB.Query(`
		SELECT pc.id, pc.code, pc.discount_amount, pc.max_uses, pc.course_id, pc.created_at,
			COALESCE((SELECT json_agg(json_build_object('student_id', pcu.student_id)) FROM promo_code_uses pcu WHERE pcu.promo_code_id = pc.id), '[]'::json) as uses
		FROM promo_codes pc ORDER BY pc.created_at DESC
	`)
	if err != nil { h.writeError(w, http.StatusInternalServerError, "DB Error"); return }
	defer rows.Close()

	var promos []map[string]any
	for rows.Next() {
		var id, code string
		var discount float64
		var maxUses int
		var courseId *string
		var ca time.Time
		var usesJSON []byte
		if err := rows.Scan(&id, &code, &discount, &maxUses, &courseId, &ca, &usesJSON); err == nil {
			var uses any
			json.Unmarshal(usesJSON, &uses)
			promos = append(promos, map[string]any{"id": id, "code": code, "discount_amount": discount, "max_uses": maxUses, "course_id": courseId, "created_at": ca, "uses": uses})
		}
	}
	if promos == nil { promos = []map[string]any{} }
	WriteJSON(w, http.StatusOK, promos)
}

func (h *Handler) AdminCreateGlobalPromo(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Code           string  `json:"code"`
		DiscountAmount float64 `json:"discount_amount"`
		MaxUses        int     `json:"max_uses"`
		CourseId       *string `json:"course_id"`
	}
	if err := ReadJSON(r, &req); err != nil { return }
	
	if req.CourseId != nil && *req.CourseId == "" { req.CourseId = nil }

	_, err := h.TeachDB.Exec(`INSERT INTO promo_codes (course_id, code, discount_amount, max_uses) VALUES ($1, $2, $3, $4)`, req.CourseId, req.Code, req.DiscountAmount, req.MaxUses)
	if err != nil { h.writeError(w, http.StatusInternalServerError, "Promo code error"); return }
	WriteJSON(w, http.StatusCreated, map[string]string{"message": "Global Promo created"})
}


// Playlist & Items
func (h *Handler) TutorCreatePlaylist(w http.ResponseWriter, r *http.Request) {
	courseId := chi.URLParam(r, "courseId")
	var req struct { Title string `json:"title"`; SortOrder int `json:"sort_order"` }
	if err := ReadJSON(r, &req); err != nil { return }
	_, err := h.TeachDB.Exec(`INSERT INTO playlists (course_id, title, sort_order) VALUES ($1, $2, $3)`, courseId, req.Title, req.SortOrder)
	if err != nil { h.writeError(w, http.StatusInternalServerError, "Failed"); return }
	WriteJSON(w, http.StatusCreated, map[string]string{"message": "Created"})
}

func (h *Handler) TutorUpdatePlaylist(w http.ResponseWriter, r *http.Request) {
	playlistId := chi.URLParam(r, "playlistId")
	var req struct { Title string `json:"title"`; SortOrder int `json:"sort_order"` }
	if err := ReadJSON(r, &req); err != nil { return }
	_, err := h.TeachDB.Exec(`UPDATE playlists SET title = $1, sort_order = $2 WHERE id = $3`, req.Title, req.SortOrder, playlistId)
	if err != nil { h.writeError(w, http.StatusInternalServerError, "Failed"); return }
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Updated"})
}

func (h *Handler) TutorDeletePlaylist(w http.ResponseWriter, r *http.Request) {
	playlistId := chi.URLParam(r, "playlistId")
	_, err := h.TeachDB.Exec(`DELETE FROM playlists WHERE id = $1`, playlistId)
	if err != nil { h.writeError(w, http.StatusInternalServerError, "Failed"); return }
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Deleted"})
}

func (h *Handler) TutorCreatePlaylistItem(w http.ResponseWriter, r *http.Request) {
	playlistId := chi.URLParam(r, "playlistId")
	var req struct { Title string `json:"title"`; ItemType string `json:"item_type"`; ContentUrl string `json:"content_url"`; ContentData string `json:"content_data"`; SortOrder int `json:"sort_order"` }
	if err := ReadJSON(r, &req); err != nil { return }
	_, err := h.TeachDB.Exec(`INSERT INTO playlist_items (playlist_id, title, item_type, content_url, content_data, sort_order) VALUES ($1, $2, $3, $4, $5, $6)`, playlistId, req.Title, req.ItemType, req.ContentUrl, req.ContentData, req.SortOrder)
	if err != nil { h.writeError(w, http.StatusInternalServerError, "Failed"); return }
	WriteJSON(w, http.StatusCreated, map[string]string{"message": "Created"})
}

func (h *Handler) TutorUpdatePlaylistItem(w http.ResponseWriter, r *http.Request) {
	itemId := chi.URLParam(r, "itemId")
	var req struct { Title string `json:"title"`; ItemType string `json:"item_type"`; ContentUrl string `json:"content_url"`; ContentData string `json:"content_data"`; SortOrder int `json:"sort_order"` }
	if err := ReadJSON(r, &req); err != nil { return }
	_, err := h.TeachDB.Exec(`UPDATE playlist_items SET title = $1, item_type = $2, content_url = $3, content_data = $4, sort_order = $5 WHERE id = $6`, req.Title, req.ItemType, req.ContentUrl, req.ContentData, req.SortOrder, itemId)
	if err != nil { h.writeError(w, http.StatusInternalServerError, "Failed"); return }
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Updated"})
}

func (h *Handler) TutorDeletePlaylistItem(w http.ResponseWriter, r *http.Request) {
	itemId := chi.URLParam(r, "itemId")
	_, err := h.TeachDB.Exec(`DELETE FROM playlist_items WHERE id = $1`, itemId)
	if err != nil { h.writeError(w, http.StatusInternalServerError, "Failed"); return }
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Deleted"})
}