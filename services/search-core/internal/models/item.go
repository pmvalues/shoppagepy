package models

// SearchItem represents an indexable product or merchant offering
type SearchItem struct {
	ID          string   `json:"id"`
	MerchantID  string   `json:"merchantId"`
	Title       string   `json:"title"`
	Brand       string   `json:"brand,omitempty"`
	Model       string   `json:"model,omitempty"`
	Category    string   `json:"category"`
	Description string   `json:"description,omitempty"`
	PriceZar    float64  `json:"priceZar"`
	City        string   `json:"city,omitempty"`
	Province    string   `json:"province,omitempty"`
	Latitude    float64  `json:"latitude,omitempty"`
	Longitude   float64  `json:"longitude,omitempty"`
	InStock     bool     `json:"inStock"`
	Verified    bool     `json:"verified"`
	Score       float64  `json:"score,omitempty"`
	DistanceKm  float64  `json:"distanceKm,omitempty"`
}

// SearchQuery represents incoming search criteria from web or mobile PWA
type SearchQuery struct {
	Query     string  `json:"q"`
	Category  string  `json:"category,omitempty"`
	Province  string  `json:"province,omitempty"`
	Latitude  float64 `json:"lat,omitempty"`
	Longitude float64 `json:"lon,omitempty"`
	RadiusKm  float64 `json:"radiusKm,omitempty"`
	Limit     int     `json:"limit,omitempty"`
	Offset    int     `json:"offset,omitempty"`
}

// SearchResult represents the search response envelope
type SearchResult struct {
	Total  int          `json:"total"`
	TookMs float64      `json:"tookMs"`
	Query  string       `json:"query"`
	Items  []SearchItem `json:"items"`
}
