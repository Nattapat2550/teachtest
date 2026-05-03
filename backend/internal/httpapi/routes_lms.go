package httpapi

import (
	"github.com/go-chi/chi/v5"
	"backend/internal/handlers"
)

func setupLMSRoutes(h *handlers.Handler) func(chi.Router) {
	return func(r chi.Router) {
		r.Get("/courses", h.GetPublishedCourses)
		r.Get("/courses/{id}", h.GetCourseDetail)

		r.Group(func(r chi.Router) {
			r.Use(h.RequireAuth)
			r.Post("/student/enroll", h.StudentEnrollCourse)
			r.Get("/student/learning", h.StudentGetMyLearning)
			r.Post("/student/progress", h.StudentUpdateProgress)
		})

		r.Group(func(r chi.Router) {
			r.Use(h.RequireAuth)
			r.Use(h.RequireRole("tutor", "admin"))

			// Courses
			r.Get("/tutor/courses", h.TutorGetMyCourses)
			r.Post("/tutor/courses", h.TutorCreateCourse)
			r.Put("/tutor/courses/{courseId}", h.TutorUpdateCourse)
			r.Delete("/tutor/courses/{courseId}", h.TutorDeleteCourse)

			// Promo Codes
			r.Get("/tutor/courses/{courseId}/promos", h.TutorGetPromoCodes)
			r.Post("/tutor/courses/{courseId}/promos", h.TutorCreatePromoCode)
			r.Put("/tutor/promos/{promoId}", h.TutorUpdatePromoCode)
			r.Delete("/tutor/promos/{promoId}", h.TutorDeletePromoCode)

			// Packages
			r.Get("/tutor/packages", h.TutorGetPackages)
			r.Post("/tutor/packages", h.TutorCreatePackage)
			r.Put("/tutor/packages/{packageId}", h.TutorUpdatePackage)
			r.Delete("/tutor/packages/{packageId}", h.TutorDeletePackage)

			// Global Admin Promos
			r.Get("/admin/promos", h.AdminGetGlobalPromos)
			r.Post("/admin/promos", h.AdminCreateGlobalPromo)

			// Playlists
			r.Post("/tutor/courses/{courseId}/playlists", h.TutorCreatePlaylist)
			r.Put("/tutor/playlists/{playlistId}", h.TutorUpdatePlaylist)
			r.Delete("/tutor/playlists/{playlistId}", h.TutorDeletePlaylist)

			// Items
			r.Post("/tutor/playlists/{playlistId}/items", h.TutorCreatePlaylistItem)
			r.Put("/tutor/items/{itemId}", h.TutorUpdatePlaylistItem)
			r.Delete("/tutor/items/{itemId}", h.TutorDeletePlaylistItem)

			r.Post("/tutor/upload", h.UploadFile)
		})
	}
}