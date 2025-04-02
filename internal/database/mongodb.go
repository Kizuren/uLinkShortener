package database

import (
    "context"
    "time"
    "strings"

    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDB struct {
    Client *mongo.Client
    DB     *mongo.Database
}

const (
    LinksCollection     = "links"
    AnalyticsCollection = "analytics"
    UsersCollection     = "users"
    DefaultDBName       = "uLinkShortener"
)

func New(uri string) (*MongoDB, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
    if err != nil {
        return nil, err
    }

    err = client.Ping(ctx, nil)
    if err != nil {
        return nil, err
    }

    dbName := getDatabaseName(uri)
    if dbName == "" {
        dbName = DefaultDBName
    }
    db := client.Database(dbName)

    return &MongoDB{
        Client: client,
        DB:     db,
    }, nil
}

func getDatabaseName(uri string) string {
    lastSlashIndex := strings.LastIndex(uri, "/")
    if lastSlashIndex == -1 || lastSlashIndex == len(uri)-1 {
        return ""
    }
    
    dbName := uri[lastSlashIndex+1:]
    
    if queryIndex := strings.Index(dbName, "?"); queryIndex != -1 {
        dbName = dbName[:queryIndex]
    }
    
    return dbName
}

func (m *MongoDB) Close() error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    return m.Client.Disconnect(ctx)
}

func (m *MongoDB) Collection(name string) *mongo.Collection {
    return m.DB.Collection(name)
}