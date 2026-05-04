package handlers

import (
	"net/http"
	"time"
)

func (h *Handler) TutorGetAnalytics(w http.ResponseWriter, r *http.Request) {
	u := GetUser(r)
	tutorId := GetUserIDStr(u)
	isAdmin := u.Role == "admin"

	response := map[string]any{
		"course_stats": []map[string]any{},
		"recent_sales": []map[string]any{},
		"promo_usages": []map[string]any{},
		"summary": map[string]any{
			"total_revenue":     0.0,
			"total_enrollments": 0,
		},
	}

	// 1. สถิติภาพรวมแต่ละคอร์ส (ยอดผู้เรียน และ รายรับ)
	courseRows, err := h.TeachDB.Query(`
		SELECT c.id, c.title,
		       COUNT(ce.id) as total_enrollments,
		       COALESCE(SUM(ce.price_paid), 0) as total_revenue
		FROM courses c
		LEFT JOIN course_enrollments ce ON c.id = ce.course_id
		WHERE ($1 = true OR c.tutor_id = $2)
		GROUP BY c.id, c.title
		ORDER BY total_revenue DESC, total_enrollments DESC
	`, isAdmin, tutorId)

	if err == nil {
		defer courseRows.Close()
		var totalRev float64 = 0
		var totalEnr int = 0
		var cStats []map[string]any

		for courseRows.Next() {
			var id, title string
			var enrollments int
			var revenue float64
			if err := courseRows.Scan(&id, &title, &enrollments, &revenue); err == nil {
				totalRev += revenue
				totalEnr += enrollments
				cStats = append(cStats, map[string]any{
					"id":                id,
					"title":             title,
					"total_enrollments": enrollments,
					"total_revenue":     revenue,
				})
			}
		}
		if cStats != nil {
			response["course_stats"] = cStats
		}
		response["summary"] = map[string]any{
			"total_revenue":     totalRev,
			"total_enrollments": totalEnr,
		}
	}

	// 2. ประวัติการสั่งซื้อล่าสุด (Recent Sales)
	salesRows, err := h.TeachDB.Query(`
		SELECT ce.id, c.title, ce.student_id, ce.price_paid, COALESCE(ce.promo_code_used, ''), ce.enrolled_at
		FROM course_enrollments ce
		JOIN courses c ON ce.course_id = c.id
		WHERE ($1 = true OR c.tutor_id = $2)
		ORDER BY ce.enrolled_at DESC
		LIMIT 100
	`, isAdmin, tutorId)

	if err == nil {
		defer salesRows.Close()
		var rSales []map[string]any
		for salesRows.Next() {
			var id, courseTitle, studentId, promoCode string
			var pricePaid float64
			var enrolledAt time.Time
			if err := salesRows.Scan(&id, &courseTitle, &studentId, &pricePaid, &promoCode, &enrolledAt); err == nil {
				rSales = append(rSales, map[string]any{
					"id":              id,
					"course_title":    courseTitle,
					"student_id":      studentId,
					"price_paid":      pricePaid,
					"promo_code_used": promoCode,
					"enrolled_at":     enrolledAt.Format(time.RFC3339),
				})
			}
		}
		if rSales != nil {
			response["recent_sales"] = rSales
		}
	}

	// 3. ประวัติการใช้ Promo Code
	promoRows, err := h.TeachDB.Query(`
		SELECT pc.code, pcu.student_id, pcu.used_at, COALESCE(ce.price_paid, 0), COALESCE(c.title, 'Global/Package')
		FROM promo_code_uses pcu
		JOIN promo_codes pc ON pcu.promo_code_id = pc.id
		LEFT JOIN course_enrollments ce ON pcu.enrollment_id = ce.id
		LEFT JOIN courses c ON ce.course_id = c.id
		WHERE ($1 = true OR c.tutor_id = $2 OR pc.course_id IS NULL)
		ORDER BY pcu.used_at DESC
		LIMIT 100
	`, isAdmin, tutorId)

	if err == nil {
		defer promoRows.Close()
		var pUsages []map[string]any
		for promoRows.Next() {
			var code, studentId, courseTitle string
			var pricePaid float64
			var usedAt time.Time
			if err := promoRows.Scan(&code, &studentId, &usedAt, &pricePaid, &courseTitle); err == nil {
				pUsages = append(pUsages, map[string]any{
					"code":         code,
					"student_id":   studentId,
					"course_title": courseTitle,
					"price_paid":   pricePaid,
					"used_at":      usedAt.Format(time.RFC3339),
				})
			}
		}
		if pUsages != nil {
			response["promo_usages"] = pUsages
		}
	}

	WriteJSON(w, http.StatusOK, response)
}