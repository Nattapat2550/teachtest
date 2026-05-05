package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestTutorCreateCourse(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to open mock db: %v", err)
	}
	defer db.Close()

	h := &Handler{TeachDB: db}

	t.Run("Success Create Course", func(t *testing.T) {
		payload := map[string]any{
			"title":                "New Course",
			"description":          "Course Description",
			"price":                999.00,
			"cover_image":          "img.png",
			"is_published":         true,
			"access_duration_days": 30,
		}
		body, _ := json.Marshal(payload)

		// Mock Database Insert
		mock.ExpectQuery("INSERT INTO courses").
			WithArgs("U123", "New Course", "Course Description", 999.00, "img.png", true, 30).
			WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("course-uuid-1"))

		req, _ := http.NewRequest("POST", "/api/tutor/courses", bytes.NewBuffer(body))
		
		// Set Context User
		user := &AuthUser{ID: 1, UserID: "U123", Role: "tutor"}
		ctx := context.WithValue(req.Context(), ctxUser, user)
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		h.TutorCreateCourse(rr, req)

		if rr.Code != http.StatusCreated {
			t.Errorf("expected status 201 Created, got %d", rr.Code)
		}
	})
}