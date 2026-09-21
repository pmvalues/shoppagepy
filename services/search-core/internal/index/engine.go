package index

import (
	"math"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/shoppage/search-core/internal/models"
)

// Weights for multi-field scoring
const (
	WeightTitle       = 4.0
	WeightModel       = 3.5
	WeightBrand       = 3.0
	WeightCategory    = 2.0
	WeightDescription = 1.0
	BoostInStock      = 1.5
	BoostVerified     = 1.0
)

// Engine is the thread-safe in-memory inverted search engine
type Engine struct {
	mu           sync.RWMutex
	items        map[string]models.SearchItem
	tokenIndex   map[string][]string // token -> item IDs
	trigramIndex map[string][]string // trigram -> item IDs
}

// NewEngine initializes a new Search Engine
func NewEngine() *Engine {
	return &Engine{
		items:        make(map[string]models.SearchItem),
		tokenIndex:   make(map[string][]string),
		trigramIndex: make(map[string][]string),
	}
}

// IndexItem indexes a single item
func (e *Engine) IndexItem(item models.SearchItem) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.indexItemLocked(item)
}

// IndexBatch indexes multiple items efficiently
func (e *Engine) IndexBatch(items []models.SearchItem) {
	e.mu.Lock()
	defer e.mu.Unlock()
	for _, it := range items {
		e.indexItemLocked(it)
	}
}

func (e *Engine) indexItemLocked(item models.SearchItem) {
	e.items[item.ID] = item

	// Extract tokens
	allTokens := make(map[string]struct{})
	for _, t := range Tokenize(item.Title) {
		allTokens[t] = struct{}{}
	}
	for _, t := range Tokenize(item.Brand) {
		allTokens[t] = struct{}{}
	}
	for _, t := range Tokenize(item.Model) {
		allTokens[t] = struct{}{}
	}
	for _, t := range Tokenize(item.Category) {
		allTokens[t] = struct{}{}
	}

	for t := range allTokens {
		e.tokenIndex[t] = append(e.tokenIndex[t], item.ID)
	}

	// Extract trigrams from title, brand, and model for fuzzy matching
	composite := item.Title + " " + item.Brand + " " + item.Model
	for tri := range GenerateTrigrams(composite) {
		e.trigramIndex[tri] = append(e.trigramIndex[tri], item.ID)
	}
}

// Haversine calculates distance between two geographic coordinates in kilometers
func Haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371.0 // Earth radius in km
	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*(math.Pi/180.0))*math.Cos(lat2*(math.Pi/180.0))*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

// Search performs instant multi-field ranking, typo-tolerance, and geo-distance scoring
func (e *Engine) Search(q models.SearchQuery) models.SearchResult {
	t0 := time.Now()
	e.mu.RLock()
	defer e.mu.RUnlock()

	queryText := strings.TrimSpace(q.Query)
	queryTokens := Tokenize(queryText)
	queryTrigrams := GenerateTrigrams(queryText)

	// Candidate scoring map: itemID -> calculated score
	candidateScores := make(map[string]float64)

	// 1. Exact & Prefix token matching
	for _, qt := range queryTokens {
		// Exact token hits
		if ids, ok := e.tokenIndex[qt]; ok {
			for _, id := range ids {
				candidateScores[id] += 3.0
			}
		}

		// Prefix token matching
		for token, ids := range e.tokenIndex {
			if strings.HasPrefix(token, qt) && token != qt {
				for _, id := range ids {
					candidateScores[id] += 1.5
				}
			}
		}
	}

	// 2. Trigram fuzzy matching for typos (e.g. "sunsink" for "Sunsynk", "inveter" for "Inverter")
	trigramHitCount := make(map[string]int)
	for tri := range queryTrigrams {
		if ids, ok := e.trigramIndex[tri]; ok {
			for _, id := range ids {
				trigramHitCount[id]++
			}
		}
	}

	// Add fuzzy similarity bonus
	for id, count := range trigramHitCount {
		if len(queryTrigrams) > 0 {
			overlapRatio := float64(count) / float64(len(queryTrigrams))
			if overlapRatio >= 0.3 {
				candidateScores[id] += overlapRatio * 2.5
			}
		}
	}

	// If no query string provided, all items are eligible
	if len(queryTokens) == 0 {
		for id := range e.items {
			candidateScores[id] = 1.0
		}
	}

	var results []models.SearchItem

	// 3. Filter and calculate final scores
	for id, score := range candidateScores {
		item := e.items[id]

		// Category filter
		if q.Category != "" && !strings.EqualFold(item.Category, q.Category) {
			continue
		}

		// Province filter
		if q.Province != "" && !strings.EqualFold(item.Province, q.Province) {
			continue
		}

		// Geo-distance calculation and radius filter
		var distanceKm float64
		if q.Latitude != 0 && q.Longitude != 0 && item.Latitude != 0 && item.Longitude != 0 {
			distanceKm = Haversine(q.Latitude, q.Longitude, item.Latitude, item.Longitude)
			item.DistanceKm = math.Round(distanceKm*10) / 10

			if q.RadiusKm > 0 && distanceKm > q.RadiusKm {
				continue // Outside user radius
			}

			// Proximity boost (closer items get up to +3.0 score)
			if distanceKm < 50.0 {
				score += (50.0 - distanceKm) / 50.0 * 3.0
			}
		}

		// In-stock & Verified trust boosts
		if item.InStock {
			score += BoostInStock
		}
		if item.Verified {
			score += BoostVerified
		}

		item.Score = math.Round(score*100) / 100
		results = append(results, item)
	}

	// Sort by score descending (highest relevance first)
	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	total := len(results)

	// Apply pagination
	offset := q.Offset
	if offset < 0 {
		offset = 0
	}
	if offset > total {
		offset = total
	}

	limit := q.Limit
	if limit <= 0 {
		limit = 24
	}
	end := offset + limit
	if end > total {
		end = total
	}

	paged := results[offset:end]
	tookMs := float64(time.Since(t0).Nanoseconds()) / 1e6

	return models.SearchResult{
		Total:  total,
		TookMs: tookMs,
		Query:  q.Query,
		Items:  paged,
	}
}

// TotalItems returns the number of indexed items
func (e *Engine) TotalItems() int {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return len(e.items)
}
