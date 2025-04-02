package handlers

import (
    "encoding/json"
    "net/http"

    "github.com/marcus7i/ulinkshortener/internal/database"
)

type Handler struct {
    DB *database.MongoDB
}

func NewHandler(db *database.MongoDB) *Handler {
    return &Handler{
        DB: db,
    }
}

func respondWithError(w http.ResponseWriter, code int, message string) {
    respondWithJSON(w, code, map[string]string{"error": message})
}

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
    response, _ := json.Marshal(payload)

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(code)
    w.Write(response)
}

func getAccountIDFromCookie(r *http.Request) string {
    cookie, err := r.Cookie("account_id")
    if err != nil {
        return ""
    }
    return cookie.Value
}