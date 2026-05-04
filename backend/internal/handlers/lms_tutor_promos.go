package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) TutorGetPromoCodes(w http.ResponseWriter, r *http.Request) {
	courseId := chi.URLParam(r, "courseId")
	rows, err := h.TeachDB.Query(`
		SELECT pc.id, pc.code, pc.discount_amount, pc.max_uses, pc.created_at,
			COALESCE((SELECT json_agg(json_build_object('student_id', pcu.student_id, 'used_at', pcu.used_at)) FROM promo_code_uses pcu WHERE pcu.promo_code_id = pc.id), '[]'::json) as uses
		FROM promo_codes pc WHERE pc.course_id = $1 ORDER BY pc.created_at DESC
	`, courseId)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "DB Error")
		return
	}
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
	if promos == nil {
		promos = []map[string]any{}
	}
	WriteJSON(w, http.StatusOK, promos)
}

func (h *Handler) TutorCreatePromoCode(w http.ResponseWriter, r *http.Request) {
	courseId := chi.URLParam(r, "courseId")
	var req struct {
		Code           string  `json:"code"`
		DiscountAmount float64 `json:"discount_amount"`
		MaxUses        int     `json:"max_uses"`
	}
	if err := ReadJSON(r, &req); err != nil {
		return
	}

	_, err := h.TeachDB.Exec(`INSERT INTO promo_codes (course_id, code, discount_amount, max_uses) VALUES ($1, $2, $3, $4)`, courseId, req.Code, req.DiscountAmount, req.MaxUses)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Promo code error")
		return
	}
	WriteJSON(w, http.StatusCreated, map[string]string{"message": "Promo created"})
}

func (h *Handler) TutorUpdatePromoCode(w http.ResponseWriter, r *http.Request) {
	promoId := chi.URLParam(r, "promoId")
	var req struct {
		Code           string  `json:"code"`
		DiscountAmount float64 `json:"discount_amount"`
		MaxUses        int     `json:"max_uses"`
	}
	if err := ReadJSON(r, &req); err != nil {
		return
	}

	_, err := h.TeachDB.Exec(`UPDATE promo_codes SET code=$1, discount_amount=$2, max_uses=$3 WHERE id=$4`, req.Code, req.DiscountAmount, req.MaxUses, promoId)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Update failed")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Updated"})
}

func (h *Handler) TutorDeletePromoCode(w http.ResponseWriter, r *http.Request) {
	promoId := chi.URLParam(r, "promoId")
	_, err := h.TeachDB.Exec(`DELETE FROM promo_codes WHERE id=$1`, promoId)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Delete failed")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Deleted"})
}

func (h *Handler) AdminGetGlobalPromos(w http.ResponseWriter, r *http.Request) {
	rows, err := h.TeachDB.Query(`
		SELECT pc.id, pc.code, pc.discount_amount, pc.max_uses, pc.course_id, pc.created_at,
			COALESCE((SELECT json_agg(json_build_object('student_id', pcu.student_id)) FROM promo_code_uses pcu WHERE pcu.promo_code_id = pc.id), '[]'::json) as uses
		FROM promo_codes pc ORDER BY pc.created_at DESC
	`)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "DB Error")
		return
	}
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
	if promos == nil {
		promos = []map[string]any{}
	}
	WriteJSON(w, http.StatusOK, promos)
}

func (h *Handler) AdminCreateGlobalPromo(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Code           string  `json:"code"`
		DiscountAmount float64 `json:"discount_amount"`
		MaxUses        int     `json:"max_uses"`
		CourseId       *string `json:"course_id"`
	}
	if err := ReadJSON(r, &req); err != nil {
		return
	}

	if req.CourseId != nil && *req.CourseId == "" {
		req.CourseId = nil
	}

	_, err := h.TeachDB.Exec(`INSERT INTO promo_codes (course_id, code, discount_amount, max_uses) VALUES ($1, $2, $3, $4)`, req.CourseId, req.Code, req.DiscountAmount, req.MaxUses)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Promo code error")
		return
	}
	WriteJSON(w, http.StatusCreated, map[string]string{"message": "Global Promo created"})
}