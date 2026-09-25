package models

import "time"

// SourceKind specifies where the raw merchant data originated
type SourceKind string

const (
	SourceOSM SourceKind = "osm"
	SourceGMB SourceKind = "gmb"
	SourceWeb SourceKind = "web_crawl"
)

// RawMerchantRecord represents unprocessed merchant data scraped or retrieved from public feeds
type RawMerchantRecord struct {
	Source      SourceKind        `json:"source"`
	SourceID    string            `json:"sourceId"`
	Name        string            `json:"name"`
	Category    string            `json:"category"`
	Address     string            `json:"address"`
	City        string            `json:"city"`
	Province    string            `json:"province"`
	PostalCode  string            `json:"postalCode"`
	Country     string            `json:"country"` // "ZA"
	Phone       string            `json:"phone"`
	Email       string            `json:"email"`
	Website     string            `json:"website"`
	Latitude    float64           `json:"latitude"`
	Longitude   float64           `json:"longitude"`
	Tags        map[string]string `json:"tags,omitempty"`
	CollectedAt time.Time         `json:"collectedAt"`
}

// NormalizedMerchantRecord represents clean, deduplicated, Shoppage-compatible merchant entity
type NormalizedMerchantRecord struct {
	ID          string     `json:"id"`
	Slug        string     `json:"slug"`
	Name        string     `json:"name"`
	Category    string     `json:"category"`
	Subcategory string     `json:"subcategory,omitempty"`
	Phone       string     `json:"phone"` // Standardized +27 format
	Email       string     `json:"email,omitempty"`
	Website     string     `json:"website,omitempty"`
	Street      string     `json:"street"`
	City        string     `json:"city"`
	Province    string     `json:"province"`
	PostalCode  string     `json:"postalCode"`
	Latitude    float64    `json:"latitude"`
	Longitude   float64    `json:"longitude"`
	Verified    bool       `json:"verified"`
	Source      SourceKind `json:"source"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}
