package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"backend/internal/config"
)

type GoogleOAuth struct {
	clientID     string
	clientSecret string
	callbackURI  string
}

type googleUserInfo struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func NewGoogleOAuth(cfg config.Config) *GoogleOAuth {
	return &GoogleOAuth{
		clientID:     strings.TrimSpace(cfg.GoogleClientID),
		clientSecret: strings.TrimSpace(cfg.GoogleClientSecret),
		callbackURI:  strings.TrimSpace(cfg.GoogleCallbackURI),
	}
}

func (g *GoogleOAuth) configured() bool {
	return g.clientID != "" && g.clientSecret != "" && g.callbackURI != ""
}

// GET /api/auth/google
func (h *Handler) AuthGoogleStart(w http.ResponseWriter, r *http.Request) {
	u, ok := h.Google.AuthURL("state")
	if !ok {
		h.writeError(w, http.StatusServiceUnavailable, "Google login is temporarily unavailable. Please try again in a moment.")
		return
	}
	http.Redirect(w, r, u, http.StatusFound)
}

// GET /api/auth/google/callback
func (h *Handler) AuthGoogleCallback(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	front := strings.TrimRight(h.Cfg.FrontendURL, "/")

	code := strings.TrimSpace(r.URL.Query().Get("code"))
	if code == "" {
		http.Redirect(w, r, front+"/login?error=oauth_failed", http.StatusFound)
		return
	}

	info, err := h.Google.ExchangeWeb(ctx, code)
	if err != nil || info == nil {
		fmt.Println("Google ExchangeWeb Error:", err)
		http.Redirect(w, r, front+"/login?error=oauth_failed", http.StatusFound)
		return
	}

	var user userDTO
	err = h.Pure.Post(ctx, "/api/internal/find-user", map[string]any{"email": info.Email}, &user)
	userExists := err == nil && user.ID != 0

	isProfileIncomplete := true
	if userExists {
		isProfileIncomplete = user.Tel == nil || strings.TrimSpace(*user.Tel) == ""
	}

	if !userExists || isProfileIncomplete {
		redirectURL := fmt.Sprintf("%s/complete-profile?email=%s&name=%s&oauthId=%s&pictureUrl=%s",
			front, url.QueryEscape(info.Email), url.QueryEscape(info.Name), url.QueryEscape(info.ID), url.QueryEscape(info.Picture))
		http.Redirect(w, r, redirectURL, http.StatusFound)
		return
	}

	var randomUserID string
	if user.UserID != nil {
		randomUserID = *user.UserID
	} else {
		randomUserID = fmt.Sprintf("%v", user.ID)
	}

	token, err := h.signToken(user.ID, randomUserID, user.Role)
	if err != nil {
		http.Redirect(w, r, front+"/login?error=oauth_failed", http.StatusFound)
		return
	}

	h.setAuthCookie(w, token, true)

	role := user.Role
	if role == "" {
		role = "user"
	}

	frag := "token=" + url.QueryEscape(token) + "&role=" + url.QueryEscape(role)
	if role == "admin" {
		http.Redirect(w, r, front+"/admin#"+frag, http.StatusFound)
		return
	}
	http.Redirect(w, r, front+"/home#"+frag, http.StatusFound)
}

// GET /api/auth/google-mobile
func (h *Handler) AuthGoogleMobileStart(w http.ResponseWriter, r *http.Request) {
	u, ok := h.Google.AuthURL("state")
	if !ok {
		h.writeError(w, http.StatusServiceUnavailable, "Google login is temporarily unavailable. Please try again in a moment.")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]any{"ok": true, "url": u})
}

type googleMobileReq struct {
	AuthCode string `json:"authCode"`
}

// POST /api/auth/google-mobile 
func (h *Handler) AuthGoogleMobileCallback(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req googleMobileReq
	if err := ReadJSON(r, &req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	if req.AuthCode == "" {
		h.writeError(w, http.StatusBadRequest, "Missing authCode")
		return
	}

	info, err := h.Google.ExchangeMobile(ctx, req.AuthCode)
	if err != nil || info == nil {
		h.writeError(w, http.StatusUnauthorized, "Invalid Google auth")
		return
	}

	var user userDTO
	err = h.Pure.Post(ctx, "/api/internal/find-user", map[string]any{"email": info.Email}, &user)
	userExists := err == nil && user.ID != 0

	isProfileIncomplete := true
	if userExists {
		isProfileIncomplete = user.Tel == nil || strings.TrimSpace(*user.Tel) == ""
	}

	if !userExists || isProfileIncomplete {
		WriteJSON(w, http.StatusOK, map[string]any{
			"isProfileIncomplete": true,
			"needCompleteProfile": true,
			"googleInfo": map[string]any{
				"email":      info.Email,
				"name":       info.Name,
				"oauthId":    info.ID,
				"pictureUrl": info.Picture,
			},
		})
		return
	}

	var randomUserID string
	if user.UserID != nil {
		randomUserID = *user.UserID
	} else {
		randomUserID = fmt.Sprintf("%v", user.ID)
	}

	token, err := h.signToken(user.ID, randomUserID, user.Role)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Token error")
		return
	}

	h.setAuthCookie(w, token, true)

	WriteJSON(w, http.StatusOK, map[string]any{
		"token":               token,
		"role":                user.Role,
		"isProfileIncomplete": false,
		"owner": map[string]any{
			"id":                  user.ID,
			"email":               user.Email,
			"username":            user.Username,
			"name":                info.Name,
			"role":                user.Role,
			"profile_picture_url": user.ProfilePictureURL,
		},
	})
}

func (g *GoogleOAuth) AuthURL(state string) (string, bool) {
	if !g.configured() {
		return "", false
	}
	q := url.Values{}
	q.Set("client_id", g.clientID)
	q.Set("redirect_uri", g.callbackURI)
	q.Set("response_type", "code")
	q.Set("scope", "openid email profile")
	q.Set("access_type", "offline")
	q.Set("prompt", "consent")
	if strings.TrimSpace(state) != "" {
		q.Set("state", state)
	}
	return "https://accounts.google.com/o/oauth2/v2/auth?" + q.Encode(), true
}

func (g *GoogleOAuth) ExchangeWeb(ctx context.Context, code string) (*googleUserInfo, error) {
	if !g.configured() {
		return nil, errors.New("google auth not configured")
	}
	tok, err := exchangeAuthCode(ctx, g.clientID, g.clientSecret, code, g.callbackURI)
	if err != nil {
		return nil, err
	}
	return fetchGoogleUserInfo(ctx, tok.AccessToken)
}

func (g *GoogleOAuth) ExchangeMobile(ctx context.Context, authCode string) (*googleUserInfo, error) {
	if g.clientID == "" || g.clientSecret == "" {
		return nil, errors.New("google auth not configured")
	}
	tok, err := exchangeAuthCode(ctx, g.clientID, g.clientSecret, authCode, "postmessage")
	if err != nil {
		return nil, err
	}
	return fetchGoogleUserInfo(ctx, tok.AccessToken)
}

type tokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
	IdToken     string `json:"id_token"`
}

func exchangeAuthCode(ctx context.Context, clientID, clientSecret, code, redirectURI string) (*tokenResponse, error) {
	form := url.Values{}
	form.Set("code", strings.TrimSpace(code))
	form.Set("client_id", clientID)
	form.Set("client_secret", clientSecret)
	form.Set("redirect_uri", redirectURI)
	form.Set("grant_type", "authorization_code")

	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, "https://oauth2.googleapis.com/token", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var tr tokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tr); err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := json.Marshal(tr)
		return nil, errors.New("google token exchange failed: " + string(bytes.TrimSpace(b)))
	}
	if strings.TrimSpace(tr.AccessToken) == "" {
		return nil, errors.New("google token exchange failed: no access_token")
	}
	return &tr, nil
}

func fetchGoogleUserInfo(ctx context.Context, accessToken string) (*googleUserInfo, error) {
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(accessToken))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var info googleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, errors.New("google userinfo failed")
	}

	info.Email = strings.TrimSpace(info.Email)
	return &info, nil
}