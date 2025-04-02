package models

import (
	"time"
)

type User struct {
	AccountID string    `json:"account_id" bson:"account_id"`
	CreatedAt time.Time `json:"created_at" bson:"created_at"`
}
