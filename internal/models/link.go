package models

import (
	"time"
)

type Link struct {
	ShortID   string    `json:"short_id" bson:"short_id"`
	TargetURL string    `json:"target_url" bson:"target_url"`
	AccountID string    `json:"account_id" bson:"account_id"`
	CreatedAt time.Time `json:"created_at" bson:"created_at"`
}
