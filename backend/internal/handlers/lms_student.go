package handlers

import (
	"encoding/json"
	"net/http"
	"time"
)

func (h *Handler) StudentEnrollCourse(w http.ResponseWriter, r *http.Request) {
	u := GetUser(r)
	studentId := GetUserIDStr(u)

	var req struct {
		CourseID  string `json:"course_id"`
		PromoCode string `json:"promo_code"`
	}
	if err := ReadJSON(r, &req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	var existingId string
	err := h.TeachDB.QueryRow("SELECT id FROM course_enrollments WHERE course_id = $1 AND student_id = $2", req.CourseID, studentId).Scan(&existingId)
	if err == nil {
		h.writeError(w, http.StatusBadRequest, "You already enrolled this course")
		return
	}

	var pricePaid float64
	err = h.TeachDB.QueryRow("SELECT price FROM courses WHERE id = $1", req.CourseID).Scan(&pricePaid)
	if err != nil {
		h.writeError(w, http.StatusNotFound, "Course not found")
		return
	}

	var promoId string
	if req.PromoCode != "" {
		var discount float64
		var maxUses int
		// รองรับ Promo Code ส่วนกลางด้วย (course_id IS NULL)
		errPromo := h.TeachDB.QueryRow("SELECT id, discount_amount, max_uses FROM promo_codes WHERE code = $1 AND (course_id = $2 OR course_id IS NULL)", req.PromoCode, req.CourseID).Scan(&promoId, &discount, &maxUses)
		
		if errPromo != nil {
			h.writeError(w, http.StatusBadRequest, "Invalid promo code")
			return
		}

		if maxUses > 0 {
			var currentUses int
			h.TeachDB.QueryRow("SELECT COUNT(*) FROM promo_code_uses WHERE promo_code_id = $1", promoId).Scan(&currentUses)
			if currentUses >= maxUses {
				h.writeError(w, http.StatusBadRequest, "Promo code usage limit reached")
				return
			}
		}

		pricePaid -= discount
		if pricePaid < 0 { pricePaid = 0 }
	}

	var enrollId string
	err = h.TeachDB.QueryRow(`
		INSERT INTO course_enrollments (course_id, student_id, price_paid, promo_code_used) 
		VALUES ($1, $2, $3, $4) RETURNING id`, req.CourseID, studentId, pricePaid, req.PromoCode).Scan(&enrollId)

	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Enrollment failed")
		return
	}

	if req.PromoCode != "" && promoId != "" {
		h.TeachDB.Exec("INSERT INTO promo_code_uses (promo_code_id, student_id, enrollment_id) VALUES ($1, $2, $3)", promoId, studentId, enrollId)
	}

	WriteJSON(w, http.StatusCreated, map[string]string{"message": "Enrolled successfully"})
}

func (h *Handler) StudentGetMyLearning(w http.ResponseWriter, r *http.Request) {
	u := GetUser(r)
	studentId := GetUserIDStr(u)

	rows, err := h.TeachDB.Query(`
		SELECT 
			ce.id as enrollment_id, ce.price_paid, ce.enrolled_at, 
			c.id as course_id, c.title, c.description, c.cover_image,
			COALESCE((
				SELECT json_agg(
					json_build_object('id', p.id, 'title', p.title, 'sort_order', p.sort_order,
						'items', COALESCE((
							SELECT json_agg(
								json_build_object('id', pi.id, 'title', pi.title, 'item_type', pi.item_type, 'content_url', pi.content_url, 'content_data', pi.content_data, 'sort_order', pi.sort_order) ORDER BY pi.sort_order
							) FROM playlist_items pi WHERE pi.playlist_id = p.id
						), '[]'::json)
					) ORDER BY p.sort_order
				) FROM playlists p WHERE p.course_id = c.id
			), '[]'::json) as playlists,
			COALESCE((SELECT json_agg(json_build_object('item_id', up.item_id, 'is_completed', up.is_completed)) FROM user_progress up WHERE up.enrollment_id = ce.id), '[]'::json) as progress
		FROM course_enrollments ce 
		JOIN courses c ON ce.course_id = c.id 
		WHERE ce.student_id = $1 
		ORDER BY ce.enrolled_at DESC
	`, studentId)

	if err != nil { h.writeError(w, http.StatusInternalServerError, "DB Error"); return }
	defer rows.Close()

	var learnings []map[string]any
	for rows.Next() {
		var enrollId, courseId, title string
		var desc, cover *string
		var price float64
		var enrolledAt time.Time
		var plJSON, progJSON []byte

		if err := rows.Scan(&enrollId, &price, &enrolledAt, &courseId, &title, &desc, &cover, &plJSON, &progJSON); err == nil {
			var playlists, progress any
			json.Unmarshal(plJSON, &playlists)
			json.Unmarshal(progJSON, &progress)

			learnings = append(learnings, map[string]any{
				"id": enrollId, "price_paid": price, "enrolled_at": enrolledAt.Format(time.RFC3339),
				"course": map[string]any{"id": courseId, "title": title, "description": desc, "cover_image": cover, "playlists": playlists, "progress": progress},
			})
		}
	}
	if learnings == nil { learnings = []map[string]any{} }
	WriteJSON(w, http.StatusOK, learnings)
}

func (h *Handler) StudentUpdateProgress(w http.ResponseWriter, r *http.Request) {
	var req struct {
		EnrollmentID string `json:"enrollment_id"`
		ItemID       string `json:"item_id"`
	}
	if err := ReadJSON(r, &req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid request data")
		return
	}

	_, err := h.TeachDB.Exec(`
		INSERT INTO user_progress (enrollment_id, item_id, is_completed, last_accessed) 
		VALUES ($1, $2, true, CURRENT_TIMESTAMP) 
		ON CONFLICT (enrollment_id, item_id) 
		DO UPDATE SET is_completed = true, last_accessed = CURRENT_TIMESTAMP
	`, req.EnrollmentID, req.ItemID)

	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to update progress")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Progress updated"})
}