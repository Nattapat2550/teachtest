package httpapi

import (
	"github.com/go-chi/chi/v5"
	"backend/internal/handlers"
)

func setupLMSRoutes(h *handlers.Handler) func(chi.Router) {
	return func(r chi.Router) {
		// Public: ใครก็ดูคอร์สที่วางขายได้
		r.Get("/courses", h.GetPublishedCourses)
		r.Get("/courses/{id}", h.GetCourseDetail)

		// Student: ต้องล็อกอิน
		r.Group(func(r chi.Router) {
			r.Use(h.RequireAuth)
			r.Post("/student/enroll", h.StudentEnrollCourse)
			r.Get("/student/learning", h.StudentGetMyLearning)
			r.Post("/student/progress", h.StudentUpdateProgress)
		})

		// Tutor: ต้องมี Role เป็น tutor หรือ admin
		r.Group(func(r chi.Router) {
			r.Use(h.RequireAuth)
			r.Use(h.RequireRole("tutor", "admin"))
			
			r.Get("/tutor/courses", h.TutorGetMyCourses)
			r.Post("/tutor/courses", h.TutorCreateCourse)
			r.Post("/tutor/courses/{courseId}/playlists", h.TutorCreatePlaylist)
			r.Post("/tutor/playlists/{playlistId}/items", h.TutorCreatePlaylistItem)
			r.Post("/tutor/courses/{courseId}/promos", h.TutorCreatePromoCode)
		})
	}
}