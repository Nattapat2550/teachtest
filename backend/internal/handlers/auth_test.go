package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/internal/config"
	"backend/internal/pureapi"

	"github.com/DATA-DOG/go-sqlmock"
	"golang.org/x/crypto/bcrypt"
)

// setupTestHandler สร้าง Mock สำหรับ Config, Pure API และ Database
func setupTestHandler() (*Handler, *httptest.Server, *sql.DB, sqlmock.Sqlmock) {
	// สร้าง Password Hash สำหรับการจำลอง Login
	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.MinCost)
	hashStr := string(hash)

	// Mock Server สำหรับ Pure API
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// ดึงค่า Body เพื่อเช็ค Email
		var reqBody map[string]any
		json.NewDecoder(r.Body).Decode(&reqBody)
		email, _ := reqBody["email"].(string)

		// ถ้าเป็น newuser@example.com ให้ส่ง 404 (ไม่มีผู้ใช้นี้)
		if email == "newuser@example.com" {
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"error": "User not found"}`))
			return
		}

		// สมมติให้ผ่านสำหรับเคส Login และ Get Profile
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{
			"ok":            true,
			"id":            1,
			"email":         "test@example.com",
			"password_hash": hashStr,
			"role":          "user",
		})
	}))

	client := pureapi.NewClient(mockServer.URL, "dummy-key")
	
	// สร้าง Mock Database ด้วย sqlmock
	db, mock, _ := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherRegexp))

	h := &Handler{
		Pure:    client,
		TeachDB: db, // เพิ่ม Mock DB ตรงนี้เพื่อแก้ปัญหา nil pointer
		Cfg: config.Config{
			JWTSecret:    "testsecretkey123",
			EmailDisable: true,
		},
	}

	return h, mockServer, db, mock
}

func TestAuthRegister(t *testing.T) {
	h, mockServer, db, _ := setupTestHandler()
	defer mockServer.Close()
	defer db.Close() // ปิด Mock DB เมื่อจบการทดสอบ

	tests := []struct {
		name           string
		payload        any
		expectedStatus int
	}{
		{
			name: "Success Registration",
			payload: map[string]any{
				"email": "newuser@example.com",
			},
			expectedStatus: http.StatusOK,
		},
		{
			name: "Missing Email",
			payload: map[string]any{
				"wrong_field": "something",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Invalid JSON",
			payload:        "invalid json string",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var body []byte
			if str, ok := tt.payload.(string); ok {
				body = []byte(str)
			} else {
				body, _ = json.Marshal(tt.payload)
			}

			req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			h.AuthRegister(rr, req)

			if rr.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d. Body: %s", tt.expectedStatus, rr.Code, rr.Body.String())
			}
		})
	}
}

func TestAuthLogin(t *testing.T) {
	h, mockServer, db, mock := setupTestHandler()
	defer mockServer.Close()
	defer db.Close()

	tests := []struct {
		name           string
		payload        any
		expectedStatus int
	}{
		{
			name: "Success Login Structure",
			payload: map[string]any{
				"email":    "test@example.com",
				"password": "password123",
				"remember": true,
			},
			expectedStatus: http.StatusOK,
		},
		{
			name: "Missing Password",
			payload: map[string]any{
				"email": "test@example.com",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Invalid JSON format",
			payload:        `{"email": "test@example.com", "password": }`,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// ดัก Database Query ให้คืนค่าสมมติเมื่อเรียกฟังก์ชัน syncUserRole
			if tt.expectedStatus == http.StatusOK {
				mock.ExpectQuery("SELECT role FROM user_roles").
					WillReturnRows(sqlmock.NewRows([]string{"role"}).AddRow("user"))
			}

			var body []byte
			if str, ok := tt.payload.(string); ok {
				body = []byte(str)
			} else {
				body, _ = json.Marshal(tt.payload)
			}

			req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			h.AuthLogin(rr, req)

			if rr.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, rr.Code)
			}
		})
	}
}

func TestAuthStatus(t *testing.T) {
	h, mockServer, db, mock := setupTestHandler()
	defer mockServer.Close()
	defer db.Close()

	// สมมติค่า Role ถ้าในกรณียิง Status ผ่านและเช็คฐานข้อมูล
	mock.ExpectQuery("SELECT role FROM user_roles").
		WillReturnRows(sqlmock.NewRows([]string{"role"}).AddRow("user"))

	req, _ := http.NewRequest("GET", "/api/auth/status", nil)
	rr := httptest.NewRecorder()
	h.AuthStatus(rr, req)

	if rr.Code != http.StatusUnauthorized && rr.Code != http.StatusOK {
		t.Errorf("Unexpected status for AuthStatus: %d", rr.Code)
	}
}

func TestAuthCompleteProfile(t *testing.T) {
	h, mockServer, db, mock := setupTestHandler()
	defer mockServer.Close()
	defer db.Close()

	tests := []struct {
		name           string
		payload        any
		expectedStatus int
	}{
		{
			name: "Complete Profile Success",
			payload: completeProfileReq{
				Email:     "googleuser@example.com",
				Username:  "newuser123",
				Password:  "securepass88",
				FirstName: "Somchai",
				LastName:  "Jaidee",
				Tel:       "0812345678",
			},
			expectedStatus: http.StatusOK,
		},
		{
			name: "Missing Required Fields",
			payload: map[string]any{
				"email": "incomplete@example.com",
			},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// ดัก Database Query สำหรับเคสสำเร็จ
			if tt.expectedStatus == http.StatusOK {
				mock.ExpectQuery("SELECT role FROM user_roles").
					WillReturnRows(sqlmock.NewRows([]string{"role"}).AddRow("user"))
			}

			body, _ := json.Marshal(tt.payload)
			req, _ := http.NewRequest("POST", "/api/auth/complete-profile", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			h.AuthCompleteProfile(rr, req)

			if rr.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, rr.Code)
			}
		})
	}
}