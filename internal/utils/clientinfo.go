package utils

import (
    "net/http"
    "strings"
    "time"

    "github.com/mssola/user_agent"
)

func GetClientInfo(r *http.Request) map[string]interface{} {
    ua := user_agent.New(r.UserAgent())
    
    ipAddress := r.Header.Get("CF-Connecting-IP")
    if ipAddress == "" {
        ipAddress = r.Header.Get("X-Real-IP")
    }
    if ipAddress == "" {
        forwardedFor := r.Header.Get("X-Forwarded-For")
        if forwardedFor != "" {
            ips := strings.Split(forwardedFor, ",")
            ipAddress = strings.TrimSpace(ips[0])
        }
    }
    if ipAddress == "" {
        ipAddress = r.RemoteAddr
        if colonIndex := strings.LastIndex(ipAddress, ":"); colonIndex != -1 {
            ipAddress = ipAddress[:colonIndex]
        }
    }
    if ipAddress == "" {
        ipAddress = "Unknown"
    }

    browser, version := ua.Browser()

    platform := r.Header.Get("sec-ch-ua-platform")
    if platform == "" {
        platform = ua.OS()
        if platform == "" {
            platform = "Unknown"
        }
    }

    language := r.Header.Get("Accept-Language")
    if language != "" && strings.Contains(language, ",") {
        language = strings.Split(language, ",")[0]
    } else if language == "" {
        language = "Unknown"
    }

    ipVersion := "IPv4"
    if strings.Contains(ipAddress, ":") {
        ipVersion = "IPv6"
    }

    return map[string]interface{}{
        "ip":              ipAddress,
        "user_agent":      r.UserAgent(),
        "platform":        platform,
        "browser":         browser,
        "version":         version,
        "language":        language,
        "referrer":        valueOrDefault(r.Referer(), "Direct"),
        "timestamp":       time.Now(),
        "remote_port":     valueOrDefault(r.Header.Get("X-Forwarded-Port"), "Unknown"),
        "accept":          valueOrDefault(r.Header.Get("Accept"), "Unknown"),
        "accept_language": valueOrDefault(r.Header.Get("Accept-Language"), "Unknown"),
        "accept_encoding": valueOrDefault(r.Header.Get("Accept-Encoding"), "Unknown"),
        "screen_size":     valueOrDefault(r.Header.Get("Sec-CH-UA-Platform-Screen"), "Unknown"),
        "window_size":     valueOrDefault(r.Header.Get("Viewport-Width"), "Unknown"),
        "country":         valueOrDefault(r.Header.Get("CF-IPCountry"), "Unknown"),
        "isp":             valueOrDefault(r.Header.Get("X-ISP"), "Unknown"),
        "ip_version":      ipVersion,
    }
}

func valueOrDefault(value, defaultValue string) string {
    if value == "" {
        return defaultValue
    }
    return value
}