package utils

import (
    "net/url"
    "strings"
)

func IsValidURL(urlStr string) bool {
    if strings.TrimSpace(urlStr) == "" {
        return false
    }

    parsedURL, err := url.Parse(urlStr)
    if err != nil {
        return false
    }

    return parsedURL.Scheme != "" && parsedURL.Host != ""
}