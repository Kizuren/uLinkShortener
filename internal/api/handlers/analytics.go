package handlers

import (
	"context"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/marcus7i/ulinkshortener/internal/database"
	"github.com/marcus7i/ulinkshortener/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func (h *Handler) GetAnalytics(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	accountID := vars["accountID"]

	ctx := context.Background()
	var user models.User
	err := h.DB.Collection(database.UsersCollection).FindOne(ctx, bson.M{"account_id": accountID}).Decode(&user)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Invalid account")
		return
	}

	cursor, err := h.DB.Collection(database.LinksCollection).Find(ctx, bson.M{"account_id": accountID})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to retrieve links")
		return
	}
	defer cursor.Close(ctx)

	var links []models.Link
	if err = cursor.All(ctx, &links); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to process links")
		return
	}

	cursor, err = h.DB.Collection(database.AnalyticsCollection).Find(ctx, bson.M{"account_id": accountID})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to retrieve analytics")
		return
	}
	defer cursor.Close(ctx)

	var analytics []map[string]interface{}
	if err = cursor.All(ctx, &analytics); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to process analytics")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"links":     links,
		"analytics": analytics,
	})
}

func (h *Handler) GetStatsData(ctx context.Context) (models.Stats, error) {

	totalLinks, err := h.DB.Collection(database.LinksCollection).CountDocuments(ctx, bson.M{})
	if err != nil {
		totalLinks = 0
	}

	totalClicks, err := h.DB.Collection(database.AnalyticsCollection).CountDocuments(ctx, bson.M{})
	if err != nil {
		totalClicks = 0
	}

	ipVersionsPipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.D{{Key: "_id", Value: "$ip_version"}, {Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}}}}},
		{{Key: "$sort", Value: bson.D{{Key: "count", Value: -1}}}},
	}
	ipVersionsCursor, err := h.DB.Collection(database.AnalyticsCollection).Aggregate(ctx, ipVersionsPipeline)
	var ipVersions []models.StatItem
	if err == nil {
		ipVersionsCursor.All(ctx, &ipVersions)
	}

	osPipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.D{{Key: "_id", Value: "$platform"}, {Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}}}}},
		{{Key: "$sort", Value: bson.D{{Key: "count", Value: -1}}}},
		{{Key: "$limit", Value: 10}},
	}
	osCursor, err := h.DB.Collection(database.AnalyticsCollection).Aggregate(ctx, osPipeline)
	var osStats []models.StatItem
	if err == nil {
		osCursor.All(ctx, &osStats)
	}

	countryPipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.D{{Key: "_id", Value: "$country"}, {Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}}}}},
		{{Key: "$sort", Value: bson.D{{Key: "count", Value: -1}}}},
		{{Key: "$limit", Value: 10}},
	}
	countryCursor, err := h.DB.Collection(database.AnalyticsCollection).Aggregate(ctx, countryPipeline)
	var countryStats []models.StatItem
	if err == nil {
		countryCursor.All(ctx, &countryStats)
	}

	ispPipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.D{{Key: "_id", Value: "$isp"}, {Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}}}}},
		{{Key: "$sort", Value: bson.D{{Key: "count", Value: -1}}}},
		{{Key: "$limit", Value: 10}},
	}
	ispCursor, err := h.DB.Collection(database.AnalyticsCollection).Aggregate(ctx, ispPipeline)
	var ispStats []models.StatItem
	if err == nil {
		ispCursor.All(ctx, &ispStats)
	}

	stats := models.Stats{
		TotalLinks:  totalLinks,
		TotalClicks: totalClicks,
		ChartData: models.ChartData{
			IPVersions:   ipVersions,
			OSStats:      osStats,
			CountryStats: countryStats,
			ISPStats:     ispStats,
		},
		LoggedIn: false,
	}

	return stats, nil
}
