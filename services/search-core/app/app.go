// Package app assembles the search core so it can run as its own process or
// be mounted in-process by the consumer-web gateway (the default).
package app

import (
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/shoppage/platform/env"
	"github.com/shoppage/platform/web"
	"github.com/shoppage/search-core/internal/index"
	"github.com/shoppage/search-core/internal/models"
)

// Options configures the application.
type Options struct {
	// Standalone adds the edge middleware the gateway otherwise provides.
	Standalone bool
}

// New builds the search handler over a freshly seeded in-memory index.
func New(opts Options) http.Handler {
	searchEngine := index.NewEngine()
	seedCatalog(searchEngine)
	slog.Info("Initialized Go Search Core Engine", "indexed_items", searchEngine.TotalItems())

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	if opts.Standalone {
		r.Use(web.ClientIP(web.TrustedProxiesFromEnv()))
		r.Use(web.Observe("search-core"))
	}
	r.Use(web.Recover)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   env.AllowedOrigins(),
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"status":       "healthy",
			"service":      "shoppage-search-core",
			"version":      "1.0.0",
			"indexedItems": searchEngine.TotalItems(),
			"timestamp":    time.Now().UTC(),
		})
	})

	r.Get("/api/search", func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query().Get("q")
		cat := r.URL.Query().Get("category")
		prov := r.URL.Query().Get("province")

		var lat, lon, radius float64
		if val := r.URL.Query().Get("lat"); val != "" {
			lat, _ = strconv.ParseFloat(val, 64)
		}
		if val := r.URL.Query().Get("lon"); val != "" {
			lon, _ = strconv.ParseFloat(val, 64)
		}
		if val := r.URL.Query().Get("radiusKm"); val != "" {
			radius, _ = strconv.ParseFloat(val, 64)
		}

		limit := 24
		if val := r.URL.Query().Get("limit"); val != "" {
			if parsed, err := strconv.Atoi(val); err == nil && parsed > 0 {
				limit = parsed
			}
		}

		offset := 0
		if val := r.URL.Query().Get("offset"); val != "" {
			if parsed, err := strconv.Atoi(val); err == nil && parsed >= 0 {
				offset = parsed
			}
		}

		query := models.SearchQuery{
			Query:     q,
			Category:  cat,
			Province:  prov,
			Latitude:  lat,
			Longitude: lon,
			RadiusKm:  radius,
			Limit:     limit,
			Offset:    offset,
		}

		result := searchEngine.Search(query)

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Search-Took-Ms", fmt.Sprintf("%.3f", result.TookMs))
		_ = json.NewEncoder(w).Encode(result)
	})

	r.With(requireIndexToken).Post("/api/index/batch", func(w http.ResponseWriter, r *http.Request) {
		var items []models.SearchItem
		if err := json.NewDecoder(r.Body).Decode(&items); err != nil {
			http.Error(w, `{"error":"invalid JSON items array"}`, http.StatusBadRequest)
			return
		}

		searchEngine.IndexBatch(items)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"success":      true,
			"indexedBatch": len(items),
			"totalIndexed": searchEngine.TotalItems(),
		})
	})

	return r
}

// requireIndexToken guards index writes with SEARCH_INDEX_TOKEN (sent as
// "Authorization: Bearer <token>"). Without a token the endpoint is open in
// development and disabled in production.
func requireIndexToken(next http.Handler) http.Handler {
	token := os.Getenv("SEARCH_INDEX_TOKEN")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if token == "" {
			if env.IsProduction() {
				http.NotFound(w, r)
				return
			}
			next.ServeHTTP(w, r)
			return
		}
		got := []byte(r.Header.Get("Authorization"))
		if subtle.ConstantTimeCompare(got, []byte("Bearer "+token)) != 1 {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func seedCatalog(e *index.Engine) {
	seeds := []models.SearchItem{
		{
			ID:          "p_sunsynk_5k",
			MerchantID:  "loc_sunpower_crownmines",
			Title:       "Sunsynk 5kW Hybrid Inverter Single Phase",
			Brand:       "Sunsynk",
			Model:       "SUNSYNK-5K-SG01LP1",
			Category:    "Solar & Energy",
			Description: "High efficiency 5000W hybrid inverter with UPS and parallel capability",
			PriceZar:    18999,
			City:        "Crown Mines, Johannesburg",
			Province:    "Gauteng",
			Latitude:    -26.2158,
			Longitude:   28.0094,
			InStock:     true,
			Verified:    true,
		},
		{
			ID:          "p_deye_8k",
			MerchantID:  "loc_cape_solar_bellville",
			Title:       "Deye 8kW Hybrid Inverter IP65 NRS097 Certified",
			Brand:       "Deye",
			Model:       "SUN-8K-SG01LP1-EU",
			Category:    "Solar & Energy",
			Description: "Outdoor rated 8kW solar inverter compatible with lithium battery storage",
			PriceZar:    28500,
			City:        "Bellville, Cape Town",
			Province:    "Western Cape",
			Latitude:    -33.8988,
			Longitude:   18.6298,
			InStock:     true,
			Verified:    true,
		},
		{
			ID:          "p_canadian_550w",
			MerchantID:  "loc_powerflex_durban",
			Title:       "Canadian Solar 550W Mono PERC Solar Panel HiKu6",
			Brand:       "Canadian Solar",
			Model:       "CS6W-550MS",
			Category:    "Solar & Energy",
			Description: "High power solar module with 25-year linear performance warranty",
			PriceZar:    1850,
			City:        "Durban North",
			Province:    "KwaZulu-Natal",
			Latitude:    -29.8012,
			Longitude:   31.0298,
			InStock:     true,
			Verified:    true,
		},
		{
			ID:          "p_mitrend_hanger_3361",
			MerchantID:  "loc_mitrend_midrand",
			Title:       "Anti-Theft Wooden Male Hanger 44cm Mahogany Finish",
			Brand:       "Mitrend",
			Model:       "MIT-3361",
			Category:    "Hospitality & Packaging",
			Description: "Solid hardwood hotel security hanger with anti-theft oval hook and ribbed bar",
			PriceZar:    22.88,
			City:        "Midrand Commercial Park",
			Province:    "Gauteng",
			Latitude:    -25.9984,
			Longitude:   28.1263,
			InStock:     true,
			Verified:    true,
		},
		{
			ID:          "p_mitrend_ring_2088",
			MerchantID:  "loc_mitrend_midrand",
			Title:       "Anti-Theft Security Replacement Ring 38mm Chrome",
			Brand:       "Mitrend",
			Model:       "MIT-2088",
			Category:    "Hospitality & Packaging",
			Description: "Solid brass replacement collar ring for hotel wardrobe security rails",
			PriceZar:    6.85,
			City:        "Midrand Commercial Park",
			Province:    "Gauteng",
			Latitude:    -25.9984,
			Longitude:   28.1263,
			InStock:     true,
			Verified:    true,
		},
		{
			ID:          "p_protea_brake_01",
			MerchantID:  "loc_za_ea_039561",
			Title:       "Ferodo Heavy Duty Brake Pads Set - VW Polo / Vivo",
			Brand:       "Ferodo",
			Model:       "FDB1781",
			Category:    "Automotive Parts",
			Description: "OEM fitment front disc brake pads with wear sensor for VW Polo Vivo",
			PriceZar:    685,
			City:        "Gqeberha (Port Elizabeth)",
			Province:    "Eastern Cape",
			Latitude:    -33.9581,
			Longitude:   25.6000,
			InStock:     true,
			Verified:    true,
		},
	}
	e.IndexBatch(seeds)
}
