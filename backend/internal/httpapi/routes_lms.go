package httpapi

import (
	"github.com/go-chi/chi/v5"

	"backend/internal/handlers"
)

func setupLMSRoutes(h *handlers.Handler) func(chi.Router) {
	return func(r chi.Router) {
		// Public:
		r.Get("/courses", h.GetPublishedCourses)
		r.Get("/courses/{id}", h.GetCourseDetail)

		// Student:
		r.Group(func(r chi.Router) {
			r.Use(h.RequireAuth)
			r.Post("/student/enroll", h.StudentEnrollCourse)
			r.Get("/student/learning", h.StudentGetMyLearning)
			r.Post("/student/progress", h.StudentUpdateProgress)
		})

		// Tutor & Admin:
		r.Group(func(r chi.Router) {
			r.Use(h.RequireAuth)
			r.Use(h.RequireRole("tutor", "admin"))

			r.Get("/tutor/courses", h.TutorGetMyCourses)
			r.Post("/tutor/courses", h.TutorCreateCourse)
			
			// Promo Codes Management
			r.Get("/tutor/courses/{courseId}/promos", h.TutorGetPromoCodes)
			r.Post("/tutor/courses/{courseId}/promos", h.TutorCreatePromoCode)

			// Playlist Management
			r.Post("/tutor/courses/{courseId}/playlists", h.TutorCreatePlaylist)
			r.Put("/tutor/playlists/{playlistId}", h.TutorUpdatePlaylist)
			r.Delete("/tutor/playlists/{playlistId}", h.TutorDeletePlaylist)

			// Playlist Items Management
			r.Post("/tutor/playlists/{playlistId}/items", h.TutorCreatePlaylistItem)
			r.Put("/tutor/items/{itemId}", h.TutorUpdatePlaylistItem)
			r.Delete("/tutor/items/{itemId}", h.TutorDeletePlaylistItem)

			// Upload Route
			r.Post("/tutor/upload", h.UploadFile)
		})
	}
}