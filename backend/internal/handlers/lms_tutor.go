package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) TutorGetMyCourses(w http.ResponseWriter, r *http.Request) {
	u := GetUser(r)
	tutorId := GetUserIDStr(u)

	rows, err := h.TeachDB.Query(`
		SELECT c.id, c.title, c.description, c.price, c.cover_image, c.is_published, c.created_at,
		COALESCE(
			(SELECT json_agg(
				json_build_object(
					'id', p.id,
					'title', p.title,
					'sort_order', p.sort_order,
					'items', COALESCE((
						SELECT json_agg(
							json_build_object(
								'id', pi.id, 
								'title', pi.title, 
								'item_type', pi.item_type,
								'content_url', pi.content_url,
								'content_data', pi.content_data,
								'sort_order', pi.sort_order
							) ORDER BY pi.sort_order
						) FROM playlist_items pi WHERE pi.playlist_id = p.id
					), '[]'::json)
				) ORDER BY p.sort_order
			) FROM playlists p WHERE p.course_id = c.id), '[]'::json
		) as playlists
		FROM courses c
		WHERE c.tutor_id = $1
		ORDER BY c.created_at DESC
	`, tutorId)

	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "DB Error: "+err.Error())
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
				"id":           id,
				"title":        title,
				"description":  desc,
				"price":        price,
				"cover_image":  cover,
				"is_published": isPub,
				"created_at":   createdAt.Format(time.RFC3339),
				"playlists":    playlists,
			})
		} else {
			log.Println("TutorGetMyCourses Scan Error:", err)
		}
	}

	if courses == nil {
		courses = []map[string]any{}
	}
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
	if err := ReadJSON(r, &req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	var id string
	err := h.TeachDB.QueryRow(`
		INSERT INTO courses (tutor_id, title, description, price, cover_image, is_published) 
		VALUES ($1, $2, $3, $4, $5, true) RETURNING id
	`, GetUserIDStr(u), req.Title, req.Description, req.Price, req.CoverImage).Scan(&id)

	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to create course")
		return
	}
	WriteJSON(w, http.StatusCreated, map[string]string{"id": id, "message": "Course created"})
}

func (h *Handler) TutorUpdateCourse(w http.ResponseWriter, r *http.Request) {
	courseId := chi.URLParam(r, "courseId")
	var req struct {
		Title       string  `json:"title"`
		Description string  `json:"description"`
		Price       float64 `json:"price"`
		CoverImage  string  `json:"cover_image"`
	}
	if err := ReadJSON(r, &req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	_, err := h.TeachDB.Exec(`
		UPDATE courses 
		SET title = $1, description = $2, price = $3, cover_image = $4 
		WHERE id = $5 AND tutor_id = $6
	`, req.Title, req.Description, req.Price, req.CoverImage, courseId, GetUserIDStr(GetUser(r)))

	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to update course")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Course updated"})
}

func (h *Handler) TutorCreatePlaylist(w http.ResponseWriter, r *http.Request) {
	courseId := chi.URLParam(r, "courseId")
	var req struct {
		Title     string `json:"title"`
		SortOrder int    `json:"sort_order"`
	}
	if err := ReadJSON(r, &req); err != nil {
		return
	}

	_, err := h.TeachDB.Exec(`INSERT INTO playlists (course_id, title, sort_order) VALUES ($1, $2, $3)`, courseId, req.Title, req.SortOrder)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to create playlist")
		return
	}
	WriteJSON(w, http.StatusCreated, map[string]string{"message": "Playlist created"})
}

func (h *Handler) TutorUpdatePlaylist(w http.ResponseWriter, r *http.Request) {
	playlistId := chi.URLParam(r, "playlistId")
	var req struct {
		Title     string `json:"title"`
		SortOrder int    `json:"sort_order"`
	}
	if err := ReadJSON(r, &req); err != nil {
		return
	}

	// อัปเดต Title และ SortOrder
	_, err := h.TeachDB.Exec(`UPDATE playlists SET title = $1, sort_order = $2 WHERE id = $3`, req.Title, req.SortOrder, playlistId)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to update playlist")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Playlist updated"})
}

func (h *Handler) TutorDeletePlaylist(w http.ResponseWriter, r *http.Request) {
	playlistId := chi.URLParam(r, "playlistId")
	_, err := h.TeachDB.Exec(`DELETE FROM playlists WHERE id = $1`, playlistId)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to delete playlist")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Playlist deleted"})
}

func (h *Handler) TutorCreatePlaylistItem(w http.ResponseWriter, r *http.Request) {
	playlistId := chi.URLParam(r, "playlistId")
	var req struct {
		Title       string `json:"title"`
		ItemType    string `json:"item_type"` // video, file, exam
		ContentUrl  string `json:"content_url"`
		ContentData string `json:"content_data"`
		SortOrder   int    `json:"sort_order"`
	}
	if err := ReadJSON(r, &req); err != nil {
		return
	}

	_, err := h.TeachDB.Exec(`
		INSERT INTO playlist_items (playlist_id, title, item_type, content_url, content_data, sort_order) 
		VALUES ($1, $2, $3, $4, $5, $6)`, 
		playlistId, req.Title, req.ItemType, req.ContentUrl, req.ContentData, req.SortOrder)

	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to create item")
		return
	}
	WriteJSON(w, http.StatusCreated, map[string]string{"message": "Item created"})
}

func (h *Handler) TutorUpdatePlaylistItem(w http.ResponseWriter, r *http.Request) {
	itemId := chi.URLParam(r, "itemId")
	var req struct {
		Title       string `json:"title"`
		ItemType    string `json:"item_type"`
		ContentUrl  string `json:"content_url"`
		ContentData string `json:"content_data"`
		SortOrder   int    `json:"sort_order"`
	}
	if err := ReadJSON(r, &req); err != nil {
		return
	}

	// อัปเดตข้อมูลไอเทมทั้งหมดรวมถึง SortOrder และ Content
	_, err := h.TeachDB.Exec(`
		UPDATE playlist_items 
		SET title = $1, item_type = $2, content_url = $3, content_data = $4, sort_order = $5 
		WHERE id = $6`, 
		req.Title, req.ItemType, req.ContentUrl, req.ContentData, req.SortOrder, itemId)

	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to update item")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Item updated"})
}

func (h *Handler) TutorDeletePlaylistItem(w http.ResponseWriter, r *http.Request) {
	itemId := chi.URLParam(r, "itemId")
	_, err := h.TeachDB.Exec(`DELETE FROM playlist_items WHERE id = $1`, itemId)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to delete item")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Item deleted"})
}

func (h *Handler) TutorCreatePromoCode(w http.ResponseWriter, r *http.Request) {
	courseId := chi.URLParam(r, "courseId")
	var req struct {
		Code           string  `json:"code"`
		DiscountAmount float64 `json:"discount_amount"`
	}
	if err := ReadJSON(r, &req); err != nil {
		return
	}

	_, err := h.TeachDB.Exec(`INSERT INTO promo_codes (course_id, code, discount_amount) VALUES ($1, $2, $3)`, courseId, req.Code, req.DiscountAmount)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Promo code might already exist or DB error")
		return
	}
	WriteJSON(w, http.StatusCreated, map[string]string{"message": "Promo code created"})
}