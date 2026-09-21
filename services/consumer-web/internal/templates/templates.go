package templates

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"github.com/shoppage/consumer-web/internal/models"
)

// -----------------------------------------------------------------------------
// VIEW MODELS
// -----------------------------------------------------------------------------

type HomeViewData struct {
	Title           string
	Description     string
	Query           string
	CurrentTab      string
	CurrentCategory string
	CurrentRetailer string
	CurrentProvince string
	CurrentSort     string
	AvgSavingsPct   int
	Posts           []models.PostItem
	Products        []models.SearchItem
	Deals           []models.RetailerDeal
	Malls           []models.Mall
	Shorts          []models.ShortItem
	Trends          []models.TradeTrend
	Guilds          []models.CommunityGuild
	TopDrops        []models.RetailerDeal
	MallsCount      int
	ProductsCount   int
	MerchantsCount  int
	DealsCount      int
	LatencyMs       float64
}

type BuyBoxViewData struct {
	Product      models.ProductDetail
	Offers       []models.MerchantOffer
	LowestPrice  float64
	UserLocation string
}

type LocationModalViewData struct {
	CurrentProvince string
	Provinces       []string
	Malls           []models.Mall
}

type SearchViewData struct {
	Title             string
	Description       string
	Query             string
	CurrentTab        string
	Category          string
	Province          string
	Retailer          string
	InStockOnly       bool
	Products          []models.SearchItem
	Deals             []models.RetailerDeal
	MatchingMerchants []models.MerchantStorefront
	MatchingMalls     []models.Mall
	LatencyMs         float64
}

type ProductViewData struct {
	Title       string
	Description string
	Query       string
	CurrentTab  string
	Product     models.ProductDetail
}

type MallsViewData struct {
	Title       string
	Description string
	Query       string
	CurrentTab  string
	Province    string
	Malls       []models.Mall
	TotalCount  int
}

type StorefrontViewData struct {
	Title            string
	Description      string
	Query            string
	CurrentTab       string
	Store            models.MerchantStorefront
	Categories       []string
	ActiveCategory   string
	Sort             string
	InStockOnly      bool
	TotalCount       int
	HeroHeadline     string
	AnnouncementText string
	AccentColor      string
	Testimonials     []models.StoreTestimonial
}

type ChatMerchantContact struct {
	ID          string
	Name        string
	Category    string
	City        string
	Avatar      string
	Cipc        string
	Verified    bool
	Online      bool
	LastMessage string
	Time        string
}

type ChatViewData struct {
	Title              string
	Description        string
	CurrentTab         string
	SelectedMerchantID string
	Merchants          []ChatMerchantContact
	Trends             []models.TradeTrend
	TopDrops           []models.RetailerDeal
	Guilds             []models.CommunityGuild
}

type TrackViewData struct {
	Title       string
	Description string
	Query       string
	CurrentTab  string
	Order       models.PlacedOrder
	Found       bool
}

type SellViewData struct {
	Title       string
	Description string
	Query       string
	CurrentTab  string
	Submitted   bool
	CreatedID   string
	ErrorMsg    string
}

type BuyerProtectionViewData struct {
	Title       string
	Description string
	Query       string
	CurrentTab  string
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

func formatComma(n int) string {
	if n < 0 {
		return "-" + formatComma(-n)
	}
	s := fmt.Sprintf("%d", n)
	if len(s) <= 3 {
		return s
	}
	var res []string
	rem := len(s) % 3
	if rem > 0 {
		res = append(res, s[:rem])
	}
	for i := rem; i < len(s); i += 3 {
		res = append(res, s[i:i+3])
	}
	return strings.Join(res, ",")
}

func FirstRune(s string) string {
	for _, r := range s {
		return string(r)
	}
	return "M"
}

// -----------------------------------------------------------------------------
// COMPILED TEMPL RENDER FUNCTIONS
// -----------------------------------------------------------------------------

// RenderHome renders the complete 3-column True Shoppage discovery stream
func RenderHome(w io.Writer, data HomeViewData) error {
	return HomeViewComponent(data).Render(context.Background(), w)
}

// RenderBuyBoxDrawer renders the slide-out BuyBox drawer partial
func RenderBuyBoxDrawer(w io.Writer, data BuyBoxViewData) error {
	return BuyBoxDrawerComponent(data).Render(context.Background(), w)
}

// RenderLocationModal renders the interactive province & area switcher modal
func RenderLocationModal(w io.Writer, data LocationModalViewData) error {
	return LocationModalComponent(data).Render(context.Background(), w)
}

// RenderNewPostCard renders a single post card when prepended to the timeline
func RenderNewPostCard(w io.Writer, post models.PostItem) error {
	return NewPostCardComponent(post).Render(context.Background(), w)
}

// RenderSearch renders the faceted Google Shopping grid (full or partial)
func RenderSearch(w io.Writer, data SearchViewData, isPartial bool) error {
	if isPartial {
		return SearchResultsGridComponent(data).Render(context.Background(), w)
	}
	return SearchPageComponent(data).Render(context.Background(), w)
}

// RenderProductDetail renders canonical product view and BuyBox comparison
func RenderProductDetail(w io.Writer, data ProductViewData) error {
	return ProductDetailComponent(data).Render(context.Background(), w)
}

// RenderMalls renders the nationwide shopping centres directory
func RenderMalls(w io.Writer, data MallsViewData) error {
	return MallsComponent(data).Render(context.Background(), w)
}

// RenderStorefront renders the public merchant storefront
func RenderStorefront(w io.Writer, data StorefrontViewData) error {
	return StorefrontComponent(data).Render(context.Background(), w)
}

// RenderStoreCatalogGrid renders the HTMX partial product grid for the storefront
func RenderStoreCatalogGrid(w io.Writer, data StorefrontViewData) error {
	return StoreCatalogGridComponent(data).Render(context.Background(), w)
}

// RenderChat renders the live commerce chat and negotiation desk
func RenderChat(w io.Writer, data ChatViewData) error {
	return ChatComponent(data).Render(context.Background(), w)
}

// RenderOfferModal renders the interactive Make an Offer modal
func RenderOfferModal(w io.Writer, data OfferModalViewData) error {
	return OfferModalComponent(data).Render(context.Background(), w)
}

// RenderOfferSuccessCard renders the confirmation card after submitting an offer
func RenderOfferSuccessCard(w io.Writer, result models.OfferSubmissionResult) error {
	return OfferSuccessCardComponent(result).Render(context.Background(), w)
}

func starRatingString(rating int) string {
	if rating <= 0 {
		rating = 5
	}
	if rating > 5 {
		rating = 5
	}
	return strings.Repeat("★", rating) + strings.Repeat("☆", 5-rating)
}

// RenderEmbedStore renders the embeddable catalog widget for external websites
func RenderEmbedStore(w io.Writer, data EmbedStoreViewData) error {
	return EmbedStoreComponent(data).Render(context.Background(), w)
}

// RenderTrack renders the real-time order & waybill tracking page
func RenderTrack(w io.Writer, data TrackViewData) error {
	return TrackPageComponent(data).Render(context.Background(), w)
}

// RenderSell renders the B2B merchant registration and onboarding portal
func RenderSell(w io.Writer, data SellViewData) error {
	return SellPageComponent(data).Render(context.Background(), w)
}

// RenderBuyerProtection renders the Shoppage Trade Assurance & Escrow policy page
func RenderBuyerProtection(w io.Writer, data BuyerProtectionViewData) error {
	return BuyerProtectionPageComponent(data).Render(context.Background(), w)
}

func schemaOrgStoreJSON(store models.MerchantStorefront, desc string) string {
	sameAs := []string{}
	if store.Website != "" {
		sameAs = append(sameAs, store.Website)
	}
	for _, s := range store.SocialLinks {
		if s.URL != "" && s.URL != store.Website {
			sameAs = append(sameAs, s.URL)
		}
	}

	payload := map[string]any{
		"@context": "https://schema.org/",
		"@type":    "WholesaleStore",
		"name":     store.Name,
		"description": desc,
		"url":      fmt.Sprintf("http://localhost:3000/m/%s", store.ID),
		"telephone": store.Phone,
		"openingHours": "Mo-Fr 08:00-17:00, Sa 08:30-13:00",
		"hasMap":   store.DirectionsURL,
		"address": map[string]string{
			"@type":          "PostalAddress",
			"streetAddress":  store.Address,
			"addressCountry": "ZA",
		},
		"aggregateRating": map[string]any{
			"@type":       "AggregateRating",
			"ratingValue": fmt.Sprintf("%.1f", store.Rating),
			"reviewCount": fmt.Sprintf("%d", store.ReviewsCount),
		},
	}
	if store.Email != "" {
		payload["email"] = store.Email
	}
	if len(sameAs) > 0 {
		payload["sameAs"] = sameAs
	}

	b, _ := json.MarshalIndent(payload, "", "  ")
	return string(b)
}


