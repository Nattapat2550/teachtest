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

func TestStudentEnrollCourse(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to open mock db: %v", err)
	}
	defer db.Close()

	h := &Handler{TeachDB: db}

	t.Run("Success Enroll Course (No Promo)", func(t *testing.T) {
		payload := map[string]string{
			"course_id":  "course-1",
			"promo_code": "",
		}
		body, _ := json.Marshal(payload)

		// 1. Begin Tx
		mock.ExpectBegin()
		// 2. Check if already enrolled (Return Error meaning NOT enrolled)
		mock.ExpectQuery("SELECT id FROM course_enrollments").
			WithArgs("course-1", "U123").
			WillReturnError(sqlmock.ErrCancelled) // Simulate no rows
		
		// 3. Get Course Price and Tutor ID
		mock.ExpectQuery("SELECT price, tutor_id FROM courses").
			WithArgs("course-1").
			WillReturnRows(sqlmock.NewRows([]string{"price", "tutor_id"}).AddRow(500.0, "TUTOR1"))

		// 4. Lock Wallet and get balance
		mock.ExpectQuery("SELECT balance FROM user_wallets").
			WithArgs("U123").
			WillReturnRows(sqlmock.NewRows([]string{"balance"}).AddRow(1000.0))

		// 5. Deduct Wallet
		mock.ExpectExec("UPDATE user_wallets SET balance = balance - \\$1").
			WithArgs(500.0, "U123").
			WillReturnResult(sqlmock.NewResult(1, 1))

		// 6. Add funds to Tutor
		mock.ExpectExec("INSERT INTO user_wallets").
			WithArgs("TUTOR1", 500.0).
			WillReturnResult(sqlmock.NewResult(1, 1))

		// 7. Insert Enrollment
		mock.ExpectQuery("INSERT INTO course_enrollments").
			WithArgs("course-1", "U123", 500.0, "").
			WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("enroll-1"))

		// 8. Commit
		mock.ExpectCommit()

		req, _ := http.NewRequest("POST", "/api/student/enroll", bytes.NewBuffer(body))
		user := &AuthUser{ID: 1, UserID: "U123", Role: "student"}
		ctx := context.WithValue(req.Context(), ctxUser, user)
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		h.StudentEnrollCourse(rr, req)

		if rr.Code != http.StatusCreated {
			t.Errorf("expected status 201 Created, got %d. Body: %s", rr.Code, rr.Body.String())
		}
	})
}