package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) TutorCreatePlaylist(w http.ResponseWriter, r *http.Request) {
	courseId := chi.URLParam(r, "courseId")
	var req struct {
		Title     string `json:"title"`
		SortOrder int    `json:"sort_order"`
	}
	if err := ReadJSON(r, &req); err != nil {
		return
	}
	_, err := h.TeachDB.Exec(`INSERT INTO playlists (course_id, title, sort_order) VALUES ($1, $2, $3)`, courseId, req.Title, req.SortOrder)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed")
		return
	}
	WriteJSON(w, http.StatusCreated, map[string]string{"message": "Created"})
}

func (h *Handler) TutorUpdatePlaylist(w http.ResponseWriter, r *http.Request) {
	playlistId := chi.URLParam(r, "playlistId")
	var req struct {
		Title     string `json:"title"`
		SortOrder int    `json:"sort_order"`
	}
	if err := ReadJSON(r, &req); err != nil {
		return
	}
	_, err := h.TeachDB.Exec(`UPDATE playlists SET title = $1, sort_order = $2 WHERE id = $3`, req.Title, req.SortOrder, playlistId)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Updated"})
}

func (h *Handler) TutorDeletePlaylist(w http.ResponseWriter, r *http.Request) {
	playlistId := chi.URLParam(r, "playlistId")
	_, err := h.TeachDB.Exec(`DELETE FROM playlists WHERE id = $1`, playlistId)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Deleted"})
}

func (h *Handler) TutorCreatePlaylistItem(w http.ResponseWriter, r *http.Request) {
	playlistId := chi.URLParam(r, "playlistId")
	var req struct {
		Title       string `json:"title"`
		ItemType    string `json:"item_type"`
		ContentUrl  string `json:"content_url"`
		ContentData string `json:"content_data"`
		SortOrder   int    `json:"sort_order"`
	}
	if err := ReadJSON(r, &req); err != nil {
		return
	}
	_, err := h.TeachDB.Exec(`INSERT INTO playlist_items (playlist_id, title, item_type, content_url, content_data, sort_order) VALUES ($1, $2, $3, $4, $5, $6)`, playlistId, req.Title, req.ItemType, req.ContentUrl, req.ContentData, req.SortOrder)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed")
		return
	}
	WriteJSON(w, http.StatusCreated, map[string]string{"message": "Created"})
}

func (h *Handler) TutorUpdatePlaylistItem(w http.ResponseWriter, r *http.Request) {
	itemId := chi.URLParam(r, "itemId")
	var req struct {
		Title       string `json:"title"`
		ItemType    string `json:"item_type"`
		ContentUrl  string `json:"content_url"`
		ContentData string `json:"content_data"`
		SortOrder   int    `json:"sort_order"`
	}
	if err := ReadJSON(r, &req); err != nil {
		return
	}
	_, err := h.TeachDB.Exec(`UPDATE playlist_items SET title = $1, item_type = $2, content_url = $3, content_data = $4, sort_order = $5 WHERE id = $6`, req.Title, req.ItemType, req.ContentUrl, req.ContentData, req.SortOrder, itemId)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Updated"})
}

func (h *Handler) TutorDeletePlaylistItem(w http.ResponseWriter, r *http.Request) {
	itemId := chi.URLParam(r, "itemId")
	_, err := h.TeachDB.Exec(`DELETE FROM playlist_items WHERE id = $1`, itemId)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{"message": "Deleted"})
}