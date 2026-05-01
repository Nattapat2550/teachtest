package handlers

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

type SubmitAppealRequest struct {
	Email  string `json:"email"`
	Reason string `json:"reason"`
}

func (h *Handler) SubmitAppeal(w http.ResponseWriter, r *http.Request) {
	var req SubmitAppealRequest
	if err := ReadJSON(r, &req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid input")
		return
	}
	if req.Email == "" || req.Reason == "" {
		h.writeError(w, http.StatusBadRequest, "Missing fields")
		return
	}

	_, err := h.TeachDB.ExecContext(r.Context(), "INSERT INTO user_appeals (email, reason) VALUES ($1, $2)", req.Email, req.Reason)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to submit appeal")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Appeal submitted"})
}

type AppealDTO struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	Reason    string    `json:"reason"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type ReviewAppealRequest struct {
	Status string `json:"status"` // "approved" or "rejected"
}

func (h *Handler) AdminReviewAppeal(w http.ResponseWriter, r *http.Request) {
	appealID := chi.URLParam(r, "id")
	var req ReviewAppealRequest
	if err := ReadJSON(r, &req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid input")
		return
	}

	var email string
	err := h.TeachDB.QueryRowContext(r.Context(), "SELECT email FROM user_appeals WHERE id = $1", appealID).Scan(&email)
	if err != nil {
		h.writeError(w, http.StatusNotFound, "Appeal not found")
		return
	}

	_, err = h.TeachDB.ExecContext(r.Context(), "UPDATE user_appeals SET status = $1 WHERE id = $2", req.Status, appealID)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to update appeal")
		return
	}

	if req.Status == "approved" {
		var user map[string]any
		err := h.Pure.Post(r.Context(), "/api/internal/find-user", map[string]any{"email": email}, &user)
		if err == nil && user["id"] != nil {
			payload := map[string]any{
				"id":     user["id"],
				"status": "active",
			}
			h.Pure.Post(r.Context(), "/api/internal/admin/users/update", payload, nil)
		}
	}

	WriteJSON(w, http.StatusOK, map[string]string{"message": "Appeal updated"})
}