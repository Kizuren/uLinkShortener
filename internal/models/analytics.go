package models

import (
	"time"
)

type Analytics struct {
	LinkID         string    `json:"link_id" bson:"link_id"`
	AccountID      string    `json:"account_id" bson:"account_id"`
	IP             string    `json:"ip" bson:"ip"`
	UserAgent      string    `json:"user_agent" bson:"user_agent"`
	Platform       string    `json:"platform" bson:"platform"`
	Browser        string    `json:"browser" bson:"browser"`
	Version        string    `json:"version" bson:"version"`
	Language       string    `json:"language" bson:"language"`
	Referrer       string    `json:"referrer" bson:"referrer"`
	Timestamp      time.Time `json:"timestamp" bson:"timestamp"`
	RemotePort     string    `json:"remote_port" bson:"remote_port"`
	Accept         string    `json:"accept" bson:"accept"`
	AcceptLanguage string    `json:"accept_language" bson:"accept_language"`
	AcceptEncoding string    `json:"accept_encoding" bson:"accept_encoding"`
	ScreenSize     string    `json:"screen_size" bson:"screen_size"`
	WindowSize     string    `json:"window_size" bson:"window_size"`
	Country        string    `json:"country" bson:"country"`
	ISP            string    `json:"isp" bson:"isp"`
	IPVersion      string    `json:"ip_version" bson:"ip_version"`
}

type Stats struct {
	TotalLinks  int64     `json:"total_links"`
	TotalClicks int64     `json:"total_clicks"`
	ChartData   ChartData `json:"chart_data"`
	LoggedIn    bool      `json:"logged_in"`
}

type ChartData struct {
	IPVersions   []StatItem `json:"ip_versions"`
	OSStats      []StatItem `json:"os_stats"`
	CountryStats []StatItem `json:"country_stats"`
	ISPStats     []StatItem `json:"isp_stats"`
}

type StatItem struct {
	ID    string `json:"_id" bson:"_id"`
	Count int    `json:"count" bson:"count"`
}
