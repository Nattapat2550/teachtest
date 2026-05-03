package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) GetPublishedCourses(w http.ResponseWriter, r *http.Request) {
	rows, err := h.TeachDB.Query(`
		SELECT id, title, description, price, cover_image, created_at 
		FROM courses WHERE is_published = true ORDER BY created_at DESC
	`)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "DB Error: "+err.Error())
		return
	}
	defer rows.Close()

	var courses []map[string]any
	for rows.Next() {
		var id, title string
		var desc, cover sql.NullString
		var price float64
		var createdAt time.Time // 🌟 แก้ไข: เปลี่ยนชนิดตัวแปรเป็น time.Time

		if err := rows.Scan(&id, &title, &desc, &price, &cover, &createdAt); err == nil {
			courses = append(courses, map[string]any{
				"id":          id,
				"title":       title,
				"description": desc.String,
				"price":       price,
				"cover_image": cover.String,
				"created_at":  createdAt.Format(time.RFC3339), // 🌟 แปลงกลับเป็น String
			})
		} else {
			log.Println("GetPublishedCourses Scan Error:", err)
		}
	}
	if courses == nil {
		courses = []map[string]any{}
	}
	WriteJSON(w, http.StatusOK, courses)
}

func (h *Handler) GetCourseDetail(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var courseId, title string
	var desc, cover sql.NullString
	var price float64
	var playlistsJSON []byte

	err := h.TeachDB.QueryRow(`
		SELECT c.id, c.title, c.description, c.price, c.cover_image, COALESCE(
			(SELECT json_agg(
				json_build_object(
					'id', p.id,
					'title', p.title,
					'sort_order', p.sort_order,
					'items', COALESCE((
						SELECT json_agg(
							json_build_object('id', pi.id, 'title', pi.title, 'item_type', pi.item_type)
							ORDER BY pi.sort_order
						)
						FROM playlist_items pi
						WHERE pi.playlist_id = p.id
					), '[]'::json)
				)
				ORDER BY p.sort_order
			)
			FROM playlists p WHERE p.course_id = c.id), '[]'::json
		) as playlists
		FROM courses c
		WHERE c.id = $1
	`, id).Scan(&courseId, &title, &desc, &price, &cover, &playlistsJSON)

	if err != nil {
		if err == sql.ErrNoRows {
			h.writeError(w, http.StatusNotFound, "Course not found")
		} else {
			h.writeError(w, http.StatusInternalServerError, "DB Error")
		}
		return
	}

	var playlists any
	json.Unmarshal(playlistsJSON, &playlists)

	WriteJSON(w, http.StatusOK, map[string]any{
		"id":          courseId,
		"title":       title,
		"description": desc.String,
		"price":       price,
		"cover_image": cover.String,
		"playlists":   playlists,
	})
}