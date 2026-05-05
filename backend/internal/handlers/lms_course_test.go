package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"backend/internal/pureapi"
	"github.com/DATA-DOG/go-sqlmock"
)

func TestGetPublishedCourses(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}
	defer db.Close()

	h := &Handler{TeachDB: db}

	t.Run("Success Get Courses", func(t *testing.T) {
		now := time.Now()
		rows := sqlmock.NewRows([]string{"id", "title", "description", "price", "cover_image", "created_at"}).
			AddRow("uuid-1", "Go API Course", "Learn Go", 1500.00, "http://image.com/go.png", now).
			AddRow("uuid-2", "React Frontend", "Learn React", 1200.00, "http://image.com/react.png", now)

		mock.ExpectQuery("SELECT id, title, description, price, cover_image, created_at FROM courses WHERE is_published = true ORDER BY created_at DESC").
			WillReturnRows(rows)

		req, _ := http.NewRequest("GET", "/api/courses", nil)
		rr := httptest.NewRecorder()

		h.GetPublishedCourses(rr, req)

		if rr.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", rr.Code)
		}

		if !strings.Contains(rr.Body.String(), "Go API Course") || !strings.Contains(rr.Body.String(), "React Frontend") {
			t.Errorf("expected response to contain course titles")
		}
	})

	t.Run("Empty Courses", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"id", "title", "description", "price", "cover_image", "created_at"})
		
		mock.ExpectQuery("SELECT id, title, description, price, cover_image, created_at FROM courses").
			WillReturnRows(rows)

		req, _ := http.NewRequest("GET", "/api/courses", nil)
		rr := httptest.NewRecorder()

		h.GetPublishedCourses(rr, req)

		if rr.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", rr.Code)
		}

		if strings.TrimSpace(rr.Body.String()) != "[]" {
			t.Errorf("expected empty JSON array, got %s", rr.Body.String())
		}
	})
}

func TestStudentGetMyLearning(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to open mock db: %v", err)
	}
	defer db.Close()

	// สร้าง Pure API Client ปลอม
	client := pureapi.NewClient("http://dummy", "dummy")
	h := &Handler{TeachDB: db, Pure: client}

	t.Run("Success Get My Learning", func(t *testing.T) {
		now := time.Now()
		
		// จำลองการ Login (ใส่ User Context)
		user := &AuthUser{ID: 1, UserID: "U123", Role: "student"}

		// จำลองข้อมูลที่จะถูกดึงจากการ Join ตาราง
		rows := sqlmock.NewRows([]string{"enrollment_id", "price_paid", "enrolled_at", "course_id", "title", "description", "cover_image", "playlists", "progress"}).
			AddRow("enroll-1", 1000.00, now, "course-1", "My Course", "Desc", "img.png", []byte(`[]`), []byte(`[]`))

		mock.ExpectQuery("SELECT ce.id as enrollment_id").
			WithArgs("U123").
			WillReturnRows(rows)

		req, _ := http.NewRequest("GET", "/api/student/learning", nil)
		ctx := context.WithValue(req.Context(), ctxUser, user)
		req = req.WithContext(ctx)
		
		rr := httptest.NewRecorder()
		h.StudentGetMyLearning(rr, req)

		if rr.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
		}
		
		if !strings.Contains(rr.Body.String(), "My Course") {
			t.Errorf("expected response to contain enrolled course title")
		}
	})
}