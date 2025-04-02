package handlers

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "time"

    "github.com/gorilla/mux"
	"github.com/marcus7i/ulinkshortener/internal/database"
    "github.com/marcus7i/ulinkshortener/internal/models"
    "github.com/marcus7i/ulinkshortener/internal/utils"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo"
)

type CreateLinkRequest struct {
    AccountID string `json:"account_id"`
    URL       string `json:"url"`
}

type CreateLinkResponse struct {
    ShortURL string `json:"short_url"`
}

func (h *Handler) CreateLink(w http.ResponseWriter, r *http.Request) {
    var req CreateLinkRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondWithError(w, http.StatusBadRequest, "Invalid request")
        return
    }

    ctx := context.Background()
    user := h.DB.Collection(database.UsersCollection).FindOne(ctx, bson.M{"account_id": req.AccountID})
    if user.Err() != nil {
        respondWithError(w, http.StatusUnauthorized, "Invalid account")
        return
    }

    if !utils.IsValidURL(req.URL) {
        respondWithError(w, http.StatusBadRequest, "Invalid URL. Please provide a valid URL with scheme (e.g., http:// or https://)")
        return
    }

    shortID := utils.GenerateShortID()

    link := models.Link{
        ShortID:   shortID,
        TargetURL: req.URL,
        AccountID: req.AccountID,
        CreatedAt: time.Now(),
    }

    _, err := h.DB.Collection(database.LinksCollection).InsertOne(ctx, link)
    if err != nil {
        respondWithError(w, http.StatusInternalServerError, "Failed to create link")
        return
    }

    respondWithJSON(w, http.StatusOK, CreateLinkResponse{
        ShortURL: fmt.Sprintf("/l/%s", shortID),
    })
}

func (h *Handler) RedirectLink(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    shortID := vars["shortID"]

    ctx := context.Background()
    var link models.Link
    err := h.DB.Collection(database.LinksCollection).FindOne(ctx, bson.M{"short_id": shortID}).Decode(&link)
    if err != nil {
        if err == mongo.ErrNoDocuments {
            http.Error(w, "Link not found", http.StatusNotFound)
        } else {
            http.Error(w, "Server error", http.StatusInternalServerError)
        }
        return
    }

    clientInfo := utils.GetClientInfo(r)
    clientInfo["link_id"] = shortID
    clientInfo["account_id"] = link.AccountID

    _, err = h.DB.Collection(database.AnalyticsCollection).InsertOne(ctx, clientInfo)
    if err != nil {
        fmt.Printf("Failed to log analytics: %v\n", err)
    }

    http.Redirect(w, r, link.TargetURL, http.StatusFound)
}

func (h *Handler) DeleteLink(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    shortID := vars["shortID"]
    accountID := getAccountIDFromCookie(r)

    if accountID == "" {
        respondWithError(w, http.StatusUnauthorized, "Not logged in")
        return
    }

    ctx := context.Background()
    var link models.Link
    err := h.DB.Collection(database.LinksCollection).FindOne(ctx, bson.M{
        "short_id":   shortID,
        "account_id": accountID,
    }).Decode(&link)

    if err != nil {
        if err == mongo.ErrNoDocuments {
            respondWithError(w, http.StatusNotFound, "Link not found or unauthorized")
        } else {
            respondWithError(w, http.StatusInternalServerError, "Server error")
        }
        return
    }

    _, err = h.DB.Collection(database.LinksCollection).DeleteOne(ctx, bson.M{"short_id": shortID})
    if err != nil {
        respondWithError(w, http.StatusInternalServerError, "Failed to delete link")
        return
    }

    _, err = h.DB.Collection(database.AnalyticsCollection).DeleteMany(ctx, bson.M{"link_id": shortID})
    if err != nil {
        fmt.Printf("Failed to delete analytics: %v\n", err)
    }

    respondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}