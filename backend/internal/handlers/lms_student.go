package handlers

import (
	"database/sql"
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

	tx, err := h.TeachDB.BeginTx(r.Context(), nil)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "DB Error")
		return
	}
	defer tx.Rollback()

	var existingId string
	err = tx.QueryRow("SELECT id FROM course_enrollments WHERE course_id = $1 AND student_id = $2", req.CourseID, studentId).Scan(&existingId)
	if err == nil {
		h.writeError(w, http.StatusBadRequest, "You already enrolled this course")
		return
	}

	var pricePaid float64
	var tutorId string
	// ดึงราคาและ ID ของติวเตอร์
	err = tx.QueryRow("SELECT price, tutor_id FROM courses WHERE id = $1", req.CourseID).Scan(&pricePaid, &tutorId)
	if err != nil {
		h.writeError(w, http.StatusNotFound, "Course not found")
		return
	}

	var promoId string
	if req.PromoCode != "" {
		var discount float64
		var maxUses int
		errPromo := tx.QueryRow("SELECT id, discount_amount, max_uses FROM promo_codes WHERE code = $1 AND (course_id = $2 OR course_id IS NULL)", req.PromoCode, req.CourseID).Scan(&promoId, &discount, &maxUses)
		if errPromo != nil {
			h.writeError(w, http.StatusBadRequest, "Invalid promo code")
			return
		}

		if maxUses > 0 {
			var currentUses int
			tx.QueryRow("SELECT COUNT(*) FROM promo_code_uses WHERE promo_code_id = $1", promoId).Scan(&currentUses)
			if currentUses >= maxUses {
				h.writeError(w, http.StatusBadRequest, "Promo code usage limit reached")
				return
			}
		}

		pricePaid -= discount
		if pricePaid < 0 {
			pricePaid = 0
		}
	}

	var balance float64
	err = tx.QueryRow("SELECT balance FROM user_wallets WHERE user_id = $1 FOR UPDATE", studentId).Scan(&balance)
	if err == sql.ErrNoRows {
		balance = 0
	} else if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Wallet check error")
		return
	}

	if balance < pricePaid {
		h.writeError(w, http.StatusBadRequest, "ยอดเงินในกระเป๋าไม่เพียงพอ กรุณาเติมเงิน")
		return
	}

	// หักเงินนักเรียน
	_, err = tx.Exec("UPDATE user_wallets SET balance = balance - $1 WHERE user_id = $2", pricePaid, studentId)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to deduct wallet")
		return
	}

	// เพิ่มเงินให้ติวเตอร์
	if pricePaid > 0 && tutorId != "" {
		_, err = tx.Exec(`
			INSERT INTO user_wallets (user_id, balance) 
			VALUES ($1, $2) 
			ON CONFLICT (user_id) DO UPDATE SET balance = user_wallets.balance + EXCLUDED.balance
		`, tutorId, pricePaid)
		if err != nil {
			h.writeError(w, http.StatusInternalServerError, "Failed to add funds to tutor")
			return
		}
	}

	var enrollId string
	err = tx.QueryRow(`
		INSERT INTO course_enrollments (course_id, student_id, price_paid, promo_code_used) 
		VALUES ($1, $2, $3, $4) RETURNING id`, req.CourseID, studentId, pricePaid, req.PromoCode).Scan(&enrollId)

	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Enrollment failed")
		return
	}

	if req.PromoCode != "" && promoId != "" {
		tx.Exec("INSERT INTO promo_code_uses (promo_code_id, student_id, enrollment_id) VALUES ($1, $2, $3)", promoId, studentId, enrollId)
	}

	tx.Commit()
	WriteJSON(w, http.StatusCreated, map[string]string{"message": "Enrolled successfully"})
}

func (h *Handler) StudentEnrollPackage(w http.ResponseWriter, r *http.Request) {
	u := GetUser(r)
	studentId := GetUserIDStr(u)

	var req struct {
		PackageID string `json:"package_id"`
		PromoCode string `json:"promo_code"`
	}
	if err := ReadJSON(r, &req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	tx, err := h.TeachDB.BeginTx(r.Context(), nil)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "DB Error")
		return
	}
	defer tx.Rollback()

	var pricePaid float64
	var courseIdsJSON []byte
	var tutorId string
	// ดึงข้อมูลราคา, คอร์ส และ ID ของติวเตอร์เจ้าของแพ็กเกจ
	err = tx.QueryRow("SELECT price, course_ids, tutor_id FROM course_packages WHERE id = $1", req.PackageID).Scan(&pricePaid, &courseIdsJSON, &tutorId)
	if err != nil {
		h.writeError(w, http.StatusNotFound, "Package not found")
		return
	}

	var courseIds []string
	json.Unmarshal(courseIdsJSON, &courseIds)
	if len(courseIds) == 0 {
		h.writeError(w, http.StatusBadRequest, "Package is empty")
		return
	}

	var promoId string
	if req.PromoCode != "" {
		var discount float64
		var maxUses int
		errPromo := tx.QueryRow("SELECT id, discount_amount, max_uses FROM promo_codes WHERE code = $1 AND course_id IS NULL", req.PromoCode).Scan(&promoId, &discount, &maxUses)
		if errPromo != nil {
			h.writeError(w, http.StatusBadRequest, "โค้ดส่วนลดไม่ถูกต้อง หรือไม่สามารถใช้กับแพ็กเกจได้")
			return
		}
		if maxUses > 0 {
			var currentUses int
			tx.QueryRow("SELECT COUNT(*) FROM promo_code_uses WHERE promo_code_id = $1", promoId).Scan(&currentUses)
			if currentUses >= maxUses {
				h.writeError(w, http.StatusBadRequest, "Promo code usage limit reached")
				return
			}
		}
		pricePaid -= discount
		if pricePaid < 0 {
			pricePaid = 0
		}
	}

	var balance float64
	err = tx.QueryRow("SELECT balance FROM user_wallets WHERE user_id = $1 FOR UPDATE", studentId).Scan(&balance)
	if err == sql.ErrNoRows {
		balance = 0
	} else if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Wallet check error")
		return
	}

	if balance < pricePaid {
		h.writeError(w, http.StatusBadRequest, "ยอดเงินในกระเป๋าไม่เพียงพอ กรุณาเติมเงิน")
		return
	}

	// หักเงินนักเรียน
	_, err = tx.Exec("UPDATE user_wallets SET balance = balance - $1 WHERE user_id = $2", pricePaid, studentId)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to deduct wallet")
		return
	}

	// เพิ่มเงินให้ติวเตอร์
	if pricePaid > 0 && tutorId != "" {
		_, err = tx.Exec(`
			INSERT INTO user_wallets (user_id, balance) 
			VALUES ($1, $2) 
			ON CONFLICT (user_id) DO UPDATE SET balance = user_wallets.balance + EXCLUDED.balance
		`, tutorId, pricePaid)
		if err != nil {
			h.writeError(w, http.StatusInternalServerError, "Failed to add funds to tutor")
			return
		}
	}

	for i, cid := range courseIds {
		var enrollId string
		var existingId string
		errCheck := tx.QueryRow("SELECT id FROM course_enrollments WHERE course_id = $1 AND student_id = $2", cid, studentId).Scan(&existingId)
		if errCheck == nil {
			continue
		}
		
		p := 0.0
		if i == 0 { p = pricePaid }

		err = tx.QueryRow(`
			INSERT INTO course_enrollments (course_id, student_id, price_paid, promo_code_used) 
			VALUES ($1, $2, $3, $4) RETURNING id`, cid, studentId, p, req.PromoCode).Scan(&enrollId)
		
		if err != nil {
			h.writeError(w, http.StatusInternalServerError, "Enrollment failed")
			return
		}

		if req.PromoCode != "" && promoId != "" && i == 0 {
			tx.Exec("INSERT INTO promo_code_uses (promo_code_id, student_id, enrollment_id) VALUES ($1, $2, $3)", promoId, studentId, enrollId)
		}
	}

	tx.Commit()
	WriteJSON(w, http.StatusCreated, map[string]string{"message": "Package Enrolled successfully"})
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
					json_build_object('id', p.id, 'title', p.title, 'sort_order', p.sort_order, 'items', 
						COALESCE((
							SELECT json_agg(
								json_build_object('id', pi.id, 'title', pi.title, 'item_type', pi.item_type, 'content_url', pi.content_url, 'content_data', pi.content_data, 'sort_order', pi.sort_order)
								ORDER BY pi.sort_order
							)
							FROM playlist_items pi WHERE pi.playlist_id = p.id
						), '[]'::json)
					) ORDER BY p.sort_order
				)
				FROM playlists p WHERE p.course_id = c.id
			), '[]'::json) as playlists,
			COALESCE((SELECT json_agg(json_build_object('item_id', up.item_id, 'is_completed', up.is_completed)) FROM user_progress up WHERE up.enrollment_id = ce.id), '[]'::json) as progress
		FROM course_enrollments ce 
		JOIN courses c ON ce.course_id = c.id 
		WHERE ce.student_id = $1 
		ORDER BY ce.enrolled_at DESC
	`, studentId)

	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "DB Error");
		return
	}
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
				"id": enrollId,
				"price_paid": price,
				"enrolled_at": enrolledAt.Format(time.RFC3339),
				"course": map[string]any{"id": courseId, "title": title, "description": desc, "cover_image": cover, "playlists": playlists, "progress": progress},
			})
		}
	}
	if learnings == nil {
		learnings = []map[string]any{}
	}
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