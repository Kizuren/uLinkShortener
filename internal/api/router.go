package api

import (
    "net/http"

    "github.com/gorilla/mux"
    "github.com/marcus7i/ulinkshortener/internal/api/handlers"
    "github.com/marcus7i/ulinkshortener/internal/database"
)

func SetupRouter(db *database.MongoDB) *mux.Router {
    r := mux.NewRouter()
    h := handlers.NewHandler(db)

    fs := http.FileServer(http.Dir("./web/static"))
    r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", fs))

	r.Use(func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if r.URL.Path == "/static/css/style.css" {
                w.Header().Set("Content-Type", "text/css")
            } else if r.URL.Path == "/static/js/script.js" {
                w.Header().Set("Content-Type", "application/javascript")
            }
            next.ServeHTTP(w, r)
        })
    })

    r.HandleFunc("/register", h.Register).Methods("POST")
    r.HandleFunc("/login", h.Login).Methods("POST")
    r.HandleFunc("/logout", h.Logout).Methods("POST")

    r.HandleFunc("/create", h.CreateLink).Methods("POST")
    r.HandleFunc("/l/{shortID}", h.RedirectLink).Methods("GET")
    r.HandleFunc("/analytics/{accountID}", h.GetAnalytics).Methods("GET")
    r.HandleFunc("/delete/{shortID}", h.DeleteLink).Methods("DELETE")

    return r
}