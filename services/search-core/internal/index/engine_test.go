package index_test

import (
	"testing"

	"github.com/shoppage/search-core/internal/index"
	"github.com/shoppage/search-core/internal/models"
)

func getSeedItems() []models.SearchItem {
	return []models.SearchItem{
		{
			ID:         "p_1",
			MerchantID: "m_sunpower",
			Title:      "Sunsynk 5kW Hybrid Inverter Single Phase",
			Brand:      "Sunsynk",
			Model:      "SUNSYNK-5K-SG01LP1",
			Category:   "Solar & Energy",
			PriceZar:   18999,
			City:       "Johannesburg",
			Province:   "Gauteng",
			Latitude:   -26.2041,
			Longitude:  28.0473,
			InStock:    true,
			Verified:   true,
		},
		{
			ID:         "p_2",
			MerchantID: "m_cape_solar",
			Title:      "Deye 8kW Hybrid Inverter IP65",
			Brand:      "Deye",
			Model:      "SUN-8K-SG01LP1-EU",
			Category:   "Solar & Energy",
			PriceZar:   28500,
			City:       "Cape Town",
			Province:   "Western Cape",
			Latitude:   -33.9249,
			Longitude:  18.4241,
			InStock:    true,
			Verified:   true,
		},
		{
			ID:         "p_3",
			MerchantID: "m_mitrend",
			Title:      "Commercial Anti-Theft Wooden Male Hanger 44cm",
			Brand:      "Mitrend",
			Model:      "MIT-3361",
			Category:   "Hospitality Supplies",
			PriceZar:   22.88,
			City:       "Midrand",
			Province:   "Gauteng",
			Latitude:   -25.9984,
			Longitude:  28.1263,
			InStock:    true,
			Verified:   true,
		},
	}
}

func TestEngine_ExactSearch(t *testing.T) {
	engine := index.NewEngine()
	engine.IndexBatch(getSeedItems())

	res := engine.Search(models.SearchQuery{
		Query: "Sunsynk 5kW",
	})

	if res.Total < 1 {
		t.Fatalf("expected at least 1 hit, got %d", res.Total)
	}
	if res.Items[0].ID != "p_1" {
		t.Fatalf("expected top item to be p_1, got %s", res.Items[0].ID)
	}
	if res.TookMs > 10.0 {
		t.Errorf("search took too long: %.2f ms", res.TookMs)
	}
}

func TestEngine_TypoTolerance(t *testing.T) {
	engine := index.NewEngine()
	engine.IndexBatch(getSeedItems())

	// Typo test 1: "sunsink" instead of "Sunsynk"
	res := engine.Search(models.SearchQuery{
		Query: "sunsink",
	})

	if res.Total < 1 {
		t.Fatalf("expected typo match for 'sunsink', got %d hits", res.Total)
	}
	if res.Items[0].ID != "p_1" {
		t.Fatalf("expected p_1 matched for 'sunsink', got %s", res.Items[0].ID)
	}

	// Typo test 2: "inveter" instead of "inverter"
	res2 := engine.Search(models.SearchQuery{
		Query: "inveter",
	})

	if res2.Total < 2 {
		t.Fatalf("expected at least 2 inverters for 'inveter', got %d", res2.Total)
	}
}

func TestEngine_GeoDistanceProximity(t *testing.T) {
	engine := index.NewEngine()
	engine.IndexBatch(getSeedItems())

	// User is located in Sandton / Johannesburg (-26.1076, 28.0567)
	// Searching for "inverter" - Johannesburg item (p_1) should be boosted over Cape Town item (p_2)
	res := engine.Search(models.SearchQuery{
		Query:     "inverter",
		Latitude:  -26.1076,
		Longitude: 28.0567,
	})

	if res.Total < 2 {
		t.Fatalf("expected 2 inverters, got %d", res.Total)
	}

	if res.Items[0].ID != "p_1" {
		t.Fatalf("expected closer Johannesburg item p_1 to rank first, got %s (distance: %.1f km)",
			res.Items[0].ID, res.Items[0].DistanceKm)
	}

	if res.Items[0].DistanceKm >= res.Items[1].DistanceKm {
		t.Errorf("expected p_1 distance (%.1f) < p_2 distance (%.1f)",
			res.Items[0].DistanceKm, res.Items[1].DistanceKm)
	}
}
