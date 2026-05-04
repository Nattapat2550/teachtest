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
		return
	}

	var id string
	err := h.TeachDB.QueryRow(`INSERT INTO courses (tutor_id, title, description, price, cover_image, is_published) VALUES ($1, $2, $3, $4, $5, true) RETURNING id`, GetUserIDStr(u), req.Title, req.Description, req.Price, req.CoverImage).Scan(&id)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to create course")
		return
	}
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
	if err := ReadJSON(r, &req); err != nil {
		return
	}

	var err error
	if u.Role == "admin" {
		_, err = h.TeachDB.Exec(`UPDATE courses SET title=$1, description=$2, price=$3, cover_image=$4 WHERE id=$5`, req.Title, req.Description, req.Price, req.CoverImage, courseId)
	} else {
		_, err = h.TeachDB.Exec(`UPDATE courses SET title=$1, description=$2, price=$3, cover_image=$4 WHERE id=$5 AND tutor_id=$6`, req.Title, req.Description, req.Price, req.CoverImage, courseId, GetUserIDStr(u))
	}

	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to update course")
		return
	}
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

	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to delete course")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Course deleted"})
}