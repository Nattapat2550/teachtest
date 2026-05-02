package handlers

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type ctxKey string

const (
	ctxUser ctxKey = "user"
)

type AuthUser struct {
	ID     int64  `json:"id"`
	UserID string `json:"user_id"` // Random UserID
	Role   string `json:"role"`
}

type jwtClaims struct {
	ID     int64  `json:"id"`      // ID (int64 from Pure API)
	UserID string `json:"user_id"` // Random UserID (TeachDB)
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func (h *Handler) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := extractTokenFromReq(r)
		if token == "" {
			h.writeError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}
		claims, err := h.parseToken(token)
		if err != nil {
			h.writeError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}
		u := &AuthUser{ID: claims.ID, UserID: claims.UserID, Role: claims.Role}
		ctx := context.WithValue(r.Context(), ctxUser, u)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (h *Handler) RequireAdmin(next http.Handler) http.Handler {
	return h.RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		u := GetUser(r)
		if u == nil || u.Role != "admin" {
			h.writeError(w, http.StatusForbidden, "Forbidden")
			return
		}
		next.ServeHTTP(w, r)
	}))
}

func GetUser(r *http.Request) *AuthUser {
	v := r.Context().Value(ctxUser)
	if v == nil {
		return nil
	}
	u, _ := v.(*AuthUser)
	return u
}

func extractTokenFromReq(r *http.Request) string {
	if t := bearerToken(r); t != "" {
		return t
	}
	c, err := r.Cookie("token")
	if err == nil && c != nil && strings.TrimSpace(c.Value) != "" {
		return strings.TrimSpace(c.Value)
	}
	return ""
}

func (h *Handler) signToken(id int64, userID string, role string) (string, error) {
	now := time.Now()
	claims := jwtClaims{
		ID:     id,
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(30 * 24 * time.Hour)),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(h.Cfg.JWTSecret))
}

func (h *Handler) parseToken(token string) (*jwtClaims, error) {
	claims := &jwtClaims{}
	_, err := jwt.ParseWithClaims(token, claims, func(_ *jwt.Token) (any, error) {
		return []byte(h.Cfg.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}
	if claims.ID <= 0 {
		return nil, errors.New("invalid claims")
	}
	return claims, nil
}

func (h *Handler) setAuthCookie(w http.ResponseWriter, token string, remember bool) {
	isProd := h.Cfg.IsProduction()
	sameSite := http.SameSiteLaxMode
	if isProd {
		sameSite = http.SameSiteNoneMode
	}

	c := &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: sameSite,
		Secure:   isProd,
	}

	if remember {
		c.MaxAge = int((30 * 24 * time.Hour).Seconds())
		c.Expires = time.Now().Add(30 * 24 * time.Hour)
	} else {
		c.MaxAge = int((24 * time.Hour).Seconds())
		c.Expires = time.Now().Add(24 * time.Hour)
	}
	http.SetCookie(w, c)
}

func (h *Handler) clearAuthCookie(w http.ResponseWriter) {
	isProd := h.Cfg.IsProduction()
	sameSite := http.SameSiteLaxMode
	if isProd {
		sameSite = http.SameSiteNoneMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: sameSite,
		Secure:   isProd,
	})
}
// RequireRole เช็คว่าผู้ใช้มี Role ตรงกับที่อนุญาตหรือไม่
func (h *Handler) RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			u := GetUser(r)
			if u == nil {
				h.writeError(w, http.StatusUnauthorized, "Unauthorized")
				return
			}
			hasRole := false
			for _, role := range roles {
				if u.Role == role {
					hasRole = true
					break
				}
			}
			if !hasRole {
				h.writeError(w, http.StatusForbidden, "Forbidden")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// GetUserIDStr เป็น Helper สำหรับดึงรหัส User ID แบบ String อย่างปลอดภัย
func GetUserIDStr(u *AuthUser) string {
	if u.UserID != "" {
		return u.UserID
	}
	return fmt.Sprintf("%v", u.ID)
}