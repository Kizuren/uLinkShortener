package handlers

import (
    "context"
    "encoding/json"
    "net/http"
    "time"

    "github.com/marcus7i/ulinkshortener/internal/database"
    "github.com/marcus7i/ulinkshortener/internal/models"
    "github.com/marcus7i/ulinkshortener/internal/utils"
    "go.mongodb.org/mongo-driver/bson"
)

type LoginRequest struct {
    AccountID string `json:"account_id"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
    ctx := context.Background()
    accountID := utils.GenerateAccountID()

    for {
        var user models.User
        err := h.DB.Collection(database.UsersCollection).FindOne(ctx, bson.M{"account_id": accountID}).Decode(&user)
        if err != nil {
            break
        }
        accountID = utils.GenerateAccountID()
    }

    _, err := h.DB.Collection(database.UsersCollection).InsertOne(ctx, models.User{
        AccountID: accountID,
        CreatedAt: time.Now(),
    })

    if err != nil {
        respondWithError(w, http.StatusInternalServerError, "Failed to create account")
        return
    }

    http.SetCookie(w, &http.Cookie{
        Name:     "account_id",
        Value:    accountID,
        Path:     "/",
        MaxAge:   31536000, // 1 year
        HttpOnly: true,
        Secure:   r.TLS != nil,
        SameSite: http.SameSiteLaxMode,
    })

    respondWithJSON(w, http.StatusOK, map[string]string{"account_id": accountID})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
    var req LoginRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondWithError(w, http.StatusBadRequest, "Invalid request")
        return
    }

    ctx := context.Background()
    var user models.User
    err := h.DB.Collection(database.UsersCollection).FindOne(ctx, bson.M{"account_id": req.AccountID}).Decode(&user)
    if err != nil {
        respondWithError(w, http.StatusUnauthorized, "Invalid account ID")
        return
    }

    http.SetCookie(w, &http.Cookie{
        Name:     "account_id",
        Value:    req.AccountID,
        Path:     "/",
        MaxAge:   31536000, // 1 year
        HttpOnly: true,
        Secure:   r.TLS != nil,
        SameSite: http.SameSiteLaxMode,
    })

    respondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
    http.SetCookie(w, &http.Cookie{
        Name:     "account_id",
        Value:    "",
        Path:     "/",
        MaxAge:   -1,
        HttpOnly: true,
        Secure:   r.TLS != nil,
        SameSite: http.SameSiteLaxMode,
    })

    respondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}