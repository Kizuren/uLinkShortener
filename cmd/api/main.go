package main

import (
	"context"
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/marcus7i/ulinkshortener/internal/api"
	"github.com/marcus7i/ulinkshortener/internal/config"
	"github.com/marcus7i/ulinkshortener/internal/database"
	"github.com/marcus7i/ulinkshortener/internal/api/handlers"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.New()

	db, err := database.New(cfg.MongoURI)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer db.Close()

	r := api.SetupRouter(db)

	funcMap := template.FuncMap{
		"marshal": func(v interface{}) template.JS {
			a, _ := json.Marshal(v)
			return template.JS(a)
		},
	}

	templates := template.Must(template.New("").Funcs(funcMap).ParseGlob("web/templates/*.html"))

	r.PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			h := handlers.NewHandler(db)
			stats, err := h.GetStatsData(r.Context())
			if err != nil {
				http.Error(w, "Error generating stats", http.StatusInternalServerError)
				return
			}
			
			cookie, _ := r.Cookie("account_id")
			if cookie != nil {
				stats.LoggedIn = true
			}
			
			templates.ExecuteTemplate(w, "index.html", map[string]interface{}{
				"stats": stats,
			})
			return
		}
	
		http.NotFound(w, r)
	})

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Printf("Server running on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Listen error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited with code 0")
}
