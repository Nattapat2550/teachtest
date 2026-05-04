package httpapi

import (
	"github.com/go-chi/chi/v5"
	"backend/internal/handlers"
)

func setupAdminRoutes(h *handlers.Handler) func(chi.Router) {
	return func(r chi.Router) {
		r.Use(h.RequireAuth)
		r.Use(h.RequireAdmin)

		// --- User Management ---
		r.Get("/users", h.AdminGetUsers)
		r.Put("/users/{id}/role", h.AdminUpdateUserRole)
		r.Put("/users/{id}/wallet", h.UpdateUserWallet)

		// --- Content Management ---
		r.Get("/news", h.AdminGetNewsList)
		r.Post("/news", h.AdminCreateNews)
		r.Put("/news/{id}", h.AdminUpdateNews)
		r.Delete("/news/{id}", h.AdminDeleteNews)

		r.Post("/documents", h.AdminCreateDocument)
		r.Put("/documents/{id}", h.AdminUpdateDocument)
		r.Delete("/documents/{id}", h.AdminDeleteDocument)

		r.Get("/appeals", h.AdminGetAppeals)
		r.Put("/appeals/{id}", h.AdminUpdateAppealStatus)
		r.Delete("/appeals/{id}", h.AdminDeleteAppeal)

		r.Get("/carousel", h.AdminGetCarousel)
		r.Post("/carousel", h.AdminCreateCarousel)
		r.Put("/carousel/{id}", h.AdminUpdateCarousel)
		r.Delete("/carousel/{id}", h.AdminDeleteCarousel)

		// --- Global Promos ---
		r.Get("/promos", h.AdminGetGlobalPromos)
		r.Post("/promos", h.AdminCreateGlobalPromo)
	}
}