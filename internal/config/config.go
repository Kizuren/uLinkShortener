package config

import (
    "os"

    "github.com/joho/godotenv"
)

type Config struct {
    MongoURI    string
    Port        string
}

func New() *Config {
    godotenv.Load()

    port := os.Getenv("PORT")
    if port == "" {
        port = "5000"
    }

    return &Config{
        MongoURI:    os.Getenv("MONGO_URI"),
        Port:        port,
    }
}