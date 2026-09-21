package store

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/shoppage/consumer-web/internal/models"
	_ "modernc.org/sqlite"
)

type Store struct {
	mu          sync.RWMutex
	products    map[string]models.ProductDetail
	merchants   map[string]models.MerchantStorefront
	orders      map[string]models.PlacedOrder
	malls       []models.Mall
	deals       []models.RetailerDeal
	posts       []models.PostItem
	shorts      []models.ShortItem
	trends      []models.TradeTrend
	guilds      []models.CommunityGuild
	dbMerchants *sql.DB
	dbProducts  *sql.DB
}

func NewStore() *Store {
	s := &Store{
		products:  make(map[string]models.ProductDetail),
		merchants: make(map[string]models.MerchantStorefront),
		orders:    make(map[string]models.PlacedOrder),
		malls:     make([]models.Mall, 0),
		deals:     make([]models.RetailerDeal, 0),
		posts:     make([]models.PostItem, 0),
		shorts:    make([]models.ShortItem, 0),
		trends:    make([]models.TradeTrend, 0),
		guilds:    make([]models.CommunityGuild, 0),
	}
	s.loadDatasets()
	s.initSqliteConnections()
	s.seedInitialOrders()
	return s
}

func (s *Store) initSqliteConnections() {
	if customRoot := os.Getenv("FOUNDATION_DATA_DIR"); customRoot != "" {
		mPath := filepath.Join(customRoot, "sa_nationwide_merchants.sqlite")
		if fi, err := os.Stat(mPath); err == nil && !fi.IsDir() {
			if db, err := sql.Open("sqlite", mPath); err == nil {
				s.dbMerchants = db
				fmt.Printf("✓ [Store] Connected live to Merchants SQLite (%s)\n", mPath)
			}
		}
		pPath := filepath.Join(customRoot, "global_food_master_products.sqlite")
		if fi, err := os.Stat(pPath); err == nil && !fi.IsDir() {
			if db, err := sql.Open("sqlite", pPath); err == nil {
				s.dbProducts = db
				fmt.Printf("✓ [Store] Connected live to Products SQLite (%s)\n", pPath)
			}
		}
		if s.dbMerchants != nil && s.dbProducts != nil {
			return
		}
	}

	candidateRoots := []string{
		".",
		"..",
		"../..",
		"../../..",
		"../../../..",
	}

	for _, root := range candidateRoots {
		mPath := filepath.Join(root, "shoppage-commerce-intelligence-foundation", "data", "study", "sa_nationwide_merchants.sqlite")
		if fi, err := os.Stat(mPath); err == nil && !fi.IsDir() {
			absPath, _ := filepath.Abs(mPath)
			if db, err := sql.Open("sqlite", absPath); err == nil {
				s.dbMerchants = db
				fmt.Printf("✓ [Store] Connected live to 3.1M Merchants SQLite (%s)\n", absPath)
			}
			break
		}
	}

	for _, root := range candidateRoots {
		pPath := filepath.Join(root, "shoppage-commerce-intelligence-foundation", "data", "study", "global_food_master_products.sqlite")
		if fi, err := os.Stat(pPath); err == nil && !fi.IsDir() {
			absPath, _ := filepath.Abs(pPath)
			if db, err := sql.Open("sqlite", absPath); err == nil {
				s.dbProducts = db
				fmt.Printf("✓ [Store] Connected live to 1.0M Products SQLite (%s)\n", absPath)
			}
			break
		}
	}
}

func (s *Store) loadDatasets() {
	s.mu.Lock()
	defer s.mu.Unlock()

	var dataDir string
	if customData := os.Getenv("DATA_DIR"); customData != "" {
		if fi, err := os.Stat(customData); err == nil && fi.IsDir() {
			dataDir = customData
		}
	}

	candidateDirs := []string{
		"data",
		"services/consumer-web/data",
		"../data",
		"../../services/consumer-web/data",
	}

	if dataDir == "" {
		for _, dir := range candidateDirs {
			if fi, err := os.Stat(dir); err == nil && fi.IsDir() {
				dataDir = dir
				break
			}
		}
	}

	if dataDir != "" {
		// 1. Load 3,315 Malls
		mallsFile := filepath.Join(dataDir, "malls.json")
		if data, err := os.ReadFile(mallsFile); err == nil {
			var loadedMalls []models.Mall
			if err := json.Unmarshal(data, &loadedMalls); err == nil && len(loadedMalls) > 0 {
				s.malls = loadedMalls
				fmt.Printf("✓ [Store] Loaded %d nationwide malls from %s\n", len(s.malls), mallsFile)
			}
		}

		// 2. Load Retailer Deals
		dealsFile := filepath.Join(dataDir, "deals.json")
		if data, err := os.ReadFile(dealsFile); err == nil {
			var loadedDeals []models.RetailerDeal
			if err := json.Unmarshal(data, &loadedDeals); err == nil && len(loadedDeals) > 0 {
				s.deals = loadedDeals
				fmt.Printf("✓ [Store] Loaded %d retailer specials from %s\n", len(s.deals), dealsFile)
			}
		}

		// 3. Load Canonical Products
		productsFile := filepath.Join(dataDir, "products.json")
		if data, err := os.ReadFile(productsFile); err == nil {
			var loadedProducts []models.ProductDetail
			if err := json.Unmarshal(data, &loadedProducts); err == nil && len(loadedProducts) > 0 {
				for _, p := range loadedProducts {
					s.products[p.CanonicalID] = p
				}
				fmt.Printf("✓ [Store] Loaded %d canonical products from %s\n", len(s.products), productsFile)
			}
		}

		// 4. Load Merchants
		merchantsFile := filepath.Join(dataDir, "merchants.json")
		if data, err := os.ReadFile(merchantsFile); err == nil {
			var loadedMerchants []models.MerchantStorefront
			if err := json.Unmarshal(data, &loadedMerchants); err == nil && len(loadedMerchants) > 0 {
				for _, m := range loadedMerchants {
					s.merchants[m.ID] = m
				}
				fmt.Printf("✓ [Store] Loaded %d merchants from %s\n", len(s.merchants), merchantsFile)
			}
		}

		// 5. Load Social Feed Posts
		postsFile := filepath.Join(dataDir, "posts.json")
		if data, err := os.ReadFile(postsFile); err == nil {
			var loadedPosts []models.PostItem
			if err := json.Unmarshal(data, &loadedPosts); err == nil && len(loadedPosts) > 0 {
				s.posts = loadedPosts
				fmt.Printf("✓ [Store] Loaded %d social feed posts from %s\n", len(s.posts), postsFile)
			}
		}

		// 6. Load Video Shorts
		shortsFile := filepath.Join(dataDir, "shorts.json")
		if data, err := os.ReadFile(shortsFile); err == nil {
			var loadedShorts []models.ShortItem
			if err := json.Unmarshal(data, &loadedShorts); err == nil && len(loadedShorts) > 0 {
				s.shorts = loadedShorts
				fmt.Printf("✓ [Store] Loaded %d video shorts from %s\n", len(s.shorts), shortsFile)
			}
		}

		// 7. Load Commerce Trends
		trendsFile := filepath.Join(dataDir, "trends.json")
		if data, err := os.ReadFile(trendsFile); err == nil {
			var loadedTrends []models.TradeTrend
			if err := json.Unmarshal(data, &loadedTrends); err == nil && len(loadedTrends) > 0 {
				s.trends = loadedTrends
			}
		}

		// 8. Load Community Guilds
		guildsFile := filepath.Join(dataDir, "guilds.json")
		if data, err := os.ReadFile(guildsFile); err == nil {
			var loadedGuilds []models.CommunityGuild
			if err := json.Unmarshal(data, &loadedGuilds); err == nil && len(loadedGuilds) > 0 {
				s.guilds = loadedGuilds
			}
		}
	}

	// Fallbacks
	if len(s.malls) == 0 {
		s.malls = s.fallbackMalls()
	}
	if len(s.products) == 0 {
		for _, p := range s.fallbackProducts() {
			s.products[p.CanonicalID] = p
		}
	}
	if len(s.deals) == 0 {
		s.deals = s.fallbackDeals()
	}
	if len(s.merchants) == 0 {
		for _, m := range s.fallbackMerchants() {
			s.merchants[m.ID] = m
		}
	}
}

func (s *Store) GetTotalCounts() (int, int, int, int) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.malls), len(s.products), len(s.deals), len(s.merchants)
}

// DealsStats aggregates real-time intelligence on national retail specials.
type DealsStats struct {
	TotalDeals      int     `json:"totalDeals"`
	AvgDiscountPct  int     `json:"avgDiscountPct"`
	TotalRetailers  int     `json:"totalRetailers"`
	TotalSavingsZar float64 `json:"totalSavingsZar"`
}

func (s *Store) GetDealsStats() DealsStats {
	s.mu.RLock()
	defer s.mu.RUnlock()

	retailers := make(map[string]bool)
	totalDiscount := 0
	totalSavings := 0.0

	for _, d := range s.deals {
		retailers[d.MerchantName] = true
		totalDiscount += d.DiscountPct
		if d.SavingsZar > 0 {
			totalSavings += d.SavingsZar
		} else if d.OldPriceZar > d.PriceZar {
			totalSavings += (d.OldPriceZar - d.PriceZar)
		}
	}

	avgDisc := 0
	if len(s.deals) > 0 {
		avgDisc = totalDiscount / len(s.deals)
	}

	return DealsStats{
		TotalDeals:      len(s.deals),
		AvgDiscountPct:  avgDisc,
		TotalRetailers:  len(retailers),
		TotalSavingsZar: totalSavings,
	}
}

func (s *Store) GetDeals(retailer string, category string, sortMode ...string) []models.RetailerDeal {
	s.mu.RLock()
	defer s.mu.RUnlock()

	retLower := strings.ToLower(strings.TrimSpace(retailer))
	catLower := strings.ToLower(strings.TrimSpace(category))

	var out []models.RetailerDeal
	for _, d := range s.deals {
		if retLower != "" && retLower != "all" {
			if !strings.Contains(strings.ToLower(d.MerchantName), retLower) &&
				!strings.Contains(strings.ToLower(d.RetailerDomain), retLower) {
				continue
			}
		}
		if catLower != "" && catLower != "all" {
			if !strings.Contains(strings.ToLower(d.Category), catLower) &&
				!strings.Contains(strings.ToLower(d.CategoryLabel), catLower) {
				continue
			}
		}
		// Ensure savings and flags
		if d.SavingsZar == 0 && d.OldPriceZar > d.PriceZar {
			d.SavingsZar = d.OldPriceZar - d.PriceZar
		}
		d.IsLocalSAStock = true
		if d.PudoCost == 0 {
			d.PudoCost = 60.00
		}
		out = append(out, d)
	}

	sort := "savings"
	if len(sortMode) > 0 && sortMode[0] != "" {
		sort = strings.ToLower(strings.TrimSpace(sortMode[0]))
	}

	switch sort {
	case "savings":
		// Highest discount percentage first
		for i := 0; i < len(out); i++ {
			for j := i + 1; j < len(out); j++ {
				if out[j].DiscountPct > out[i].DiscountPct {
					out[i], out[j] = out[j], out[i]
				}
			}
		}
	case "price_asc":
		// Lowest price first
		for i := 0; i < len(out); i++ {
			for j := i + 1; j < len(out); j++ {
				if out[j].PriceZar < out[i].PriceZar {
					out[i], out[j] = out[j], out[i]
				}
			}
		}
	case "price_desc":
		// Highest price first
		for i := 0; i < len(out); i++ {
			for j := i + 1; j < len(out); j++ {
				if out[j].PriceZar > out[i].PriceZar {
					out[i], out[j] = out[j], out[i]
				}
			}
		}
	case "expiring":
		// Lowest stock percentage first (scarcity/urgency)
		for i := 0; i < len(out); i++ {
			for j := i + 1; j < len(out); j++ {
				if out[j].StockPct < out[i].StockPct {
					out[i], out[j] = out[j], out[i]
				}
			}
		}
	}

	return out
}

func (s *Store) GetTopDrops(limit int) []models.RetailerDeal {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var drops []models.RetailerDeal
	for _, d := range s.deals {
		if d.DiscountPct > 0 {
			drops = append(drops, d)
		}
	}
	// Sort by discount descending
	for i := 0; i < len(drops); i++ {
		for j := i + 1; j < len(drops); j++ {
			if drops[j].DiscountPct > drops[i].DiscountPct {
				drops[i], drops[j] = drops[j], drops[i]
			}
		}
	}
	if limit > 0 && len(drops) > limit {
		return drops[:limit]
	}
	return drops
}

func (s *Store) GetFeedPosts(tab string, query string) []models.PostItem {
	s.mu.RLock()
	defer s.mu.RUnlock()

	tabLower := strings.ToLower(strings.TrimSpace(tab))
	qLower := strings.ToLower(strings.TrimSpace(query))

	var out []models.PostItem
	for _, p := range s.posts {
		// Filter by tab
		if tabLower != "" && tabLower != "foryou" && tabLower != "all" {
			matchedTab := false
			for _, t := range p.Tabs {
				if strings.ToLower(t) == tabLower {
					matchedTab = true
					break
				}
			}
			if !matchedTab {
				continue
			}
		}

		// Filter by search query
		if qLower != "" {
			if !strings.Contains(strings.ToLower(p.Text), qLower) &&
				!strings.Contains(strings.ToLower(p.Name), qLower) &&
				!strings.Contains(strings.ToLower(p.Handle), qLower) &&
				(p.Product == nil || !strings.Contains(strings.ToLower(p.Product.Name), qLower)) {
				continue
			}
		}

		out = append(out, p)
	}
	return out
}

func (s *Store) AddPost(post models.PostItem) {
	s.mu.Lock()
	defer s.mu.Unlock()
	// Prepend new post
	s.posts = append([]models.PostItem{post}, s.posts...)
}

func (s *Store) VotePoll(postID string, optIndex int) (*models.PostPoll, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.posts {
		if s.posts[i].ID == postID && s.posts[i].Poll != nil {
			poll := s.posts[i].Poll
			if optIndex >= 0 && optIndex < len(poll.Options) {
				poll.Options[optIndex].Votes++
				poll.Voted = &optIndex
				return poll, true
			}
		}
	}
	return nil, false
}

func (s *Store) GetShorts(category string) []models.ShortItem {
	s.mu.RLock()
	defer s.mu.RUnlock()

	catLower := strings.ToLower(strings.TrimSpace(category))
	if catLower == "" || catLower == "all" {
		return s.shorts
	}

	var out []models.ShortItem
	for _, sh := range s.shorts {
		if strings.ToLower(sh.Category) == catLower {
			out = append(out, sh)
		}
	}
	return out
}

func (s *Store) GetTrends() []models.TradeTrend {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.trends
}

func (s *Store) GetGuilds() []models.CommunityGuild {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.guilds
}

// South African localized synonyms and typo-correction dictionary
var saSynonyms = map[string][]string{
	"sneaker":       {"sneakers", "takkies", "trainers", "shoes"},
	"sneakers":      {"takkies", "trainers", "shoes"},
	"takkies":       {"sneakers", "trainers", "shoes", "footwear"},
	"inverter":      {"invertr", "inverters", "sunsynk", "deye", "solar"},
	"invertr":       {"inverter", "inverters", "sunsynk", "solar"},
	"inverters":     {"inverter", "sunsynk", "solar", "deye"},
	"solar":         {"inverter", "battery", "panel", "lithium", "sunsynk"},
	"bakkie":        {"canopy", "trailer", "hardware", "tools"},
	"geyser":        {"water heater", "plumbing", "kwickot"},
	"boxes":         {"cartons", "packaging", "corrugated"},
	"carton":        {"cartons", "boxes", "packaging"},
	"cartons":       {"boxes", "packaging", "corrugated"},
	"hangers":       {"hanger", "anti-theft", "mit-3361", "wooden hanger"},
	"hanger":        {"hangers", "anti-theft", "mit-3361"},
	"load shedding": {"loadshedding", "inverter", "battery", "backup", "solar"},
	"loadshedding":  {"load shedding", "inverter", "battery", "backup"},
}

func expandSASynonyms(q string) []string {
	q = strings.ToLower(strings.TrimSpace(q))
	if q == "" {
		return nil
	}
	expanded := []string{q}
	// Direct dictionary hit
	if syns, ok := saSynonyms[q]; ok {
		expanded = append(expanded, syns...)
	}
	// Multi-word checks
	words := strings.Fields(q)
	if len(words) > 1 {
		for _, w := range words {
			if syns, ok := saSynonyms[w]; ok {
				expanded = append(expanded, syns...)
			}
		}
	}
	// Common suffix typo: e.g. "invertr" -> "inverter"
	if strings.HasSuffix(q, "r") && !strings.HasSuffix(q, "er") {
		expanded = append(expanded, q+"er")
	}
	return expanded
}

func (s *Store) SearchProducts(query string, category string, province string, inStockOnly bool) []models.SearchItem {
	cleanQ := strings.TrimSpace(query)

	// 1. Try querying Go Search Core (:8082) for typo-tolerant trigram search
	if cleanQ != "" {
		items := s.querySearchCore(cleanQ)
		if len(items) > 0 {
			return s.filterItems(items, category, province, inStockOnly)
		}
	}

	// 2. In-memory product search with SA synonyms & typo correction
	s.mu.RLock()
	var results []models.SearchItem
	qLower := strings.ToLower(cleanQ)
	expandedQueries := expandSASynonyms(qLower)

	for _, p := range s.products {
		match := false
		if cleanQ == "" {
			match = true
		} else {
			target := strings.ToLower(p.Title + " " + p.Brand + " " + p.Model + " " + p.Category + " " + p.Description)
			for _, eq := range expandedQueries {
				if strings.Contains(target, eq) {
					match = true
					break
				}
			}
		}

		if match {
			results = append(results, s.detailToSearchItem(p))
		}
	}

	// 3. Search deals if matching query
	if len(results) == 0 && cleanQ != "" {
		for _, d := range s.deals {
			if strings.Contains(strings.ToLower(d.Title), qLower) ||
				strings.Contains(strings.ToLower(d.Brand), qLower) ||
				strings.Contains(strings.ToLower(d.MerchantName), qLower) {
				results = append(results, models.SearchItem{
					ID:          d.ID,
					Title:       d.Title,
					Brand:       d.Brand,
					Model:       d.MerchantName,
					Category:    d.CategoryLabel,
					Description: fmt.Sprintf("%s · %s", d.Availability, d.LocationHint),
					PriceZar:    d.PriceZar,
					OffersCount: 1,
					City:        "Major Retail Superstores",
					Province:    "Nationwide",
					InStock:     true,
					Verified:    true,
					ImageURL:    d.ImageURL,
					Rating:      4.9,
				})
			}
		}
	}
	s.mu.RUnlock()

	// 4. If still no results and we have the 1.0M products SQLite connected, query SQLite directly!
	if len(results) == 0 && cleanQ != "" && s.dbProducts != nil {
		rows, err := s.dbProducts.Query(
			"SELECT master_product_id, product_name, brand, category_path FROM global_master_product WHERE product_name LIKE ? LIMIT 24",
			"%"+cleanQ+"%",
		)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id, name, brand, cat sql.NullString
				if err := rows.Scan(&id, &name, &brand, &cat); err == nil {
					results = append(results, models.SearchItem{
						ID:          id.String,
						Title:       name.String,
						Brand:       brand.String,
						Category:    cat.String,
						Description: "1,000,000+ Master Product Index",
						PriceZar:    49.99,
						OffersCount: 1,
						City:        "South Africa Nationwide",
						Province:    "Nationwide",
						InStock:     true,
						Verified:    true,
						ImageURL:    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
						Rating:      4.8,
					})
				}
			}
		}
	}

	return s.filterItems(results, category, province, inStockOnly)
}

func GenerateDefaultVolumeTiers(basePrice float64) []models.VolumeTier {
	if basePrice <= 0 {
		basePrice = 99.0
	}
	t2Price := float64(int(basePrice*0.88*100)) / 100
	t3Price := float64(int(basePrice*0.76*100)) / 100
	return []models.VolumeTier{
		{MinQty: 1, MaxQty: 4, PriceZar: basePrice, Label: "1–4 units (Retail)", DiscountPct: 0},
		{MinQty: 5, MaxQty: 19, PriceZar: t2Price, Label: "5–19 units (Contractor)", DiscountPct: 12},
		{MinQty: 20, MaxQty: 100, PriceZar: t3Price, Label: "20+ carton (Wholesale)", DiscountPct: 24},
	}
}

func GenerateDefaultDeliveryOptions(city string) []models.DeliveryOption {
	if city == "" {
		city = "Gauteng"
	}
	return []models.DeliveryOption{
		{
			Type:        "pickup",
			Label:       "Mall / Store Collection",
			CostZar:     0,
			CostDisplay: "FREE",
			Eta:         "Ready in 2h",
			Description: fmt.Sprintf("Collect free from local trade counter in %s", city),
			Icon:        "🏬",
		},
		{
			Type:        "pudo",
			Label:       "Pudo / Smart Locker",
			CostZar:     60.00,
			CostDisplay: "R 60.00",
			Eta:         "2–3 Business Days",
			Description: "Available at Engen & mall smart lockers nationwide",
			Icon:        "📦",
		},
		{
			Type:        "courier",
			Label:       "Door Delivery (Courier Guy)",
			CostZar:     85.00,
			CostDisplay: "R 85.00",
			Eta:         "1–2 Business Days",
			Description: "Tracked door-to-door courier dispatch",
			Icon:        "🚚",
		},
	}
}

func GenerateMerchantTrust(name string, city string, rating float64) *models.MerchantTrust {
	if rating <= 0 {
		rating = 4.9
	}
	if city == "" {
		city = "Johannesburg"
	}
	cipcNum := fmt.Sprintf("2021/%06d/07", (len(name)*142857)%899999+100000)
	return &models.MerchantTrust{
		CipcVerified:  true,
		CipcNumber:    cipcNum,
		PhysicalStore: true,
		StoreAddress:  fmt.Sprintf("Shop 14, Commercial Centre, %s", city),
		MallName:      "Mall of Africa / Cresta Centre",
		ResponseTime:  "< 15 mins",
		TradesCount:   142 + len(name)*9,
		Rating:        rating,
	}
}

func (s *Store) detailToSearchItem(p models.ProductDetail) models.SearchItem {
	price := p.LowestOfferPrice
	if price <= 0 {
		price = p.EstimatedPriceZar
	}
	return models.SearchItem{
		ID:              p.CanonicalID,
		Title:           p.Title,
		Brand:           p.Brand,
		Model:           p.Model,
		Category:        p.Category,
		Description:     p.Description,
		PriceZar:        price,
		OffersCount:     len(p.Offers),
		City:            "Crown Mines, Johannesburg",
		Province:        "Gauteng",
		InStock:         true,
		Verified:        true,
		ImageURL:        p.ImageURL,
		Rating:          4.9,
		IsLocalSAStock:  true,
		DispatchHours:   24,
		PickupAvailable: true,
		PickupMall:      "Cresta / Mall of Africa",
		VolumeTiers:     GenerateDefaultVolumeTiers(price),
		Trust:           GenerateMerchantTrust(p.Brand, "Johannesburg", 4.9),
		DeliveryOptions: GenerateDefaultDeliveryOptions("Johannesburg"),
	}
}

func (s *Store) filterItems(items []models.SearchItem, category string, province string, inStockOnly bool) []models.SearchItem {
	var filtered []models.SearchItem
	catLower := strings.ToLower(strings.TrimSpace(category))
	provLower := strings.ToLower(strings.TrimSpace(province))

	for _, item := range items {
		if catLower != "" && catLower != "all" && !strings.Contains(strings.ToLower(item.Category), catLower) {
			continue
		}
		if provLower != "" && provLower != "all" && !strings.Contains(strings.ToLower(item.Province), provLower) {
			continue
		}
		if inStockOnly && !item.InStock {
			continue
		}
		filtered = append(filtered, item)
	}
	return filtered
}

func (s *Store) querySearchCore(q string) []models.SearchItem {
	client := &http.Client{Timeout: 35 * time.Millisecond}
	resp, err := client.Get(fmt.Sprintf("http://localhost:8082/api/search?q=%s", url.QueryEscape(q)))
	if err != nil || resp.StatusCode != http.StatusOK {
		return nil
	}
	defer resp.Body.Close()

	var searchCoreRes struct {
		Items []struct {
			ID          string  `json:"id"`
			Title       string  `json:"title"`
			Brand       string  `json:"brand"`
			Model       string  `json:"model"`
			Category    string  `json:"category"`
			Description string  `json:"description"`
			PriceZar    float64 `json:"priceZar"`
			City        string  `json:"city"`
			Province    string  `json:"province"`
			InStock     bool    `json:"inStock"`
			Verified    bool    `json:"verified"`
			Score       float64 `json:"score"`
		} `json:"items"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&searchCoreRes); err != nil {
		return nil
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	var out []models.SearchItem
	for _, it := range searchCoreRes.Items {
		img := "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80"
		offersCount := 1
		if detail, ok := s.products[it.ID]; ok {
			img = detail.ImageURL
			offersCount = len(detail.Offers)
		}
		out = append(out, models.SearchItem{
			ID:          it.ID,
			Title:       it.Title,
			Brand:       it.Brand,
			Model:       it.Model,
			Category:    it.Category,
			Description: it.Description,
			PriceZar:    it.PriceZar,
			OffersCount: offersCount,
			City:        it.City,
			Province:    it.Province,
			InStock:     it.InStock,
			Verified:    it.Verified,
			ImageURL:    img,
			Score:       it.Score,
			Rating:      4.9,
		})
	}
	return out
}

func (s *Store) enrichProductDetail(p models.ProductDetail) models.ProductDetail {
	p.IsLocalSAStock = true
	price := p.LowestOfferPrice
	if price <= 0 {
		price = p.EstimatedPriceZar
	}
	p.VolumeTiers = GenerateDefaultVolumeTiers(price)
	p.DeliveryOptions = GenerateDefaultDeliveryOptions("Johannesburg")

	// Amazon-style Algorithmic Buy Box Winner scoring
	var bestIdx = -1
	var maxScore float64 = -1.0

	for i := range p.Offers {
		p.Offers[i].IsLocalSAStock = true
		p.Offers[i].PickupAvailable = true
		p.Offers[i].PickupTime = "Ready in 2h"
		p.Offers[i].Trust = GenerateMerchantTrust(p.Offers[i].MerchantName, p.Offers[i].City, p.Offers[i].Rating)
		p.Offers[i].VolumeTiers = GenerateDefaultVolumeTiers(p.Offers[i].PriceZar)
		p.Offers[i].DeliveryOptions = GenerateDefaultDeliveryOptions(p.Offers[i].City)

		// Buy Box Formula: price efficiency (lower price = higher points) + merchant rating + in-stock bonus + verified seller bonus
		offerPrice := p.Offers[i].PriceZar
		if offerPrice <= 0 {
			offerPrice = 100.0
		}
		score := (1000.0 / offerPrice) + (p.Offers[i].Rating * 15.0)
		if p.Offers[i].InStock {
			score += 50.0
		}
		if p.Offers[i].Verified {
			score += 25.0
		}
		p.Offers[i].BuyBoxScore = score
		if score > maxScore {
			maxScore = score
			bestIdx = i
		}
	}

	if bestIdx >= 0 && len(p.Offers) > 0 {
		p.Offers[bestIdx].IsBuyBoxWinner = true
		// Sort so Buy Box winner is the primary top offer
		if bestIdx != 0 {
			p.Offers[0], p.Offers[bestIdx] = p.Offers[bestIdx], p.Offers[0]
		}
	}
	return p
}

// GetSearchSuggestions returns high-intent query autocomplete suggestions
func (s *Store) GetSearchSuggestions(query string) []string {
	qLower := strings.ToLower(strings.TrimSpace(query))
	if qLower == "" {
		return []string{"Sunsynk 5kW Hybrid Inverter", "Commercial Anti-Theft Wooden Hangers", "Silicone Clip-On Food Lids", "Pudo Smart Locker Nationwide"}
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	var suggestions []string
	seen := make(map[string]bool)

	// Search product titles and brands
	for _, p := range s.products {
		if strings.Contains(strings.ToLower(p.Title), qLower) {
			if !seen[p.Title] {
				seen[p.Title] = true
				suggestions = append(suggestions, p.Title)
			}
		}
		if strings.Contains(strings.ToLower(p.Brand), qLower) && p.Brand != "" {
			if !seen[p.Brand] {
				seen[p.Brand] = true
				suggestions = append(suggestions, p.Brand)
			}
		}
		if len(suggestions) >= 8 {
			return suggestions
		}
	}

	// Search categories
	for _, p := range s.products {
		if strings.Contains(strings.ToLower(p.Category), qLower) && p.Category != "" {
			catName := strings.ReplaceAll(p.Category, "-", " ")
			if !seen[catName] {
				seen[catName] = true
				suggestions = append(suggestions, catName)
			}
		}
		if len(suggestions) >= 8 {
			return suggestions
		}
	}

	// Search merchants (businesses/suppliers)
	for _, m := range s.merchants {
		if strings.Contains(strings.ToLower(m.Name), qLower) {
			if !seen[m.Name] {
				seen[m.Name] = true
				suggestions = append(suggestions, m.Name)
			}
		}
		if len(suggestions) >= 8 {
			return suggestions
		}
	}

	// Search malls (places/shopping centres)
	for _, mall := range s.malls {
		if strings.Contains(strings.ToLower(mall.Name), qLower) {
			if !seen[mall.Name] {
				seen[mall.Name] = true
				suggestions = append(suggestions, mall.Name)
			}
		}
		if len(suggestions) >= 8 {
			return suggestions
		}
	}

	return suggestions
}

func (s *Store) GetProductByID(id string) (models.ProductDetail, bool) {
	s.mu.RLock()
	p, ok := s.products[id]
	if ok {
		s.mu.RUnlock()
		return s.enrichProductDetail(p), true
	}

	// Normalized prefix resolution (p_sunsynk_5k vs var_sunsynk_8kw_hybrid)
	cleanID := strings.TrimPrefix(strings.TrimPrefix(id, "p_"), "var_")
	cleanLower := strings.ToLower(cleanID)
	for k, v := range s.products {
		kLower := strings.ToLower(k)
		if strings.Contains(kLower, cleanLower) || strings.Contains(cleanLower, strings.TrimPrefix(kLower, "var_")) {
			s.mu.RUnlock()
			return s.enrichProductDetail(v), true
		}
	}

	// Check deals
	for _, d := range s.deals {
		if d.ID == id {
			s.mu.RUnlock()
			dtl := models.ProductDetail{
				CanonicalID:       d.ID,
				Title:             d.Title,
				Brand:             d.Brand,
				Model:             d.MerchantName,
				Category:          d.CategoryLabel,
				Description:       fmt.Sprintf("%s. Verified retailer deal at %s.", d.Availability, d.LocationHint),
				ImageURL:          d.ImageURL,
				Gallery:           []string{d.ImageURL},
				EstimatedPriceZar: d.PriceZar,
				LowestOfferPrice:  d.PriceZar,
				Specs: map[string]string{
					"Retailer":     d.MerchantName,
					"Direct URL":   d.DirectURL,
					"Special":      d.Badge,
					"Valid Until":  d.ValidUntil,
					"Availability": d.Availability,
				},
				Offers: []models.MerchantOffer{
					{
						MerchantID:   "retailer_" + strings.ToLower(d.RetailerDomain),
						MerchantName: d.MerchantName,
						City:         d.LocationHint,
						Province:     "Nationwide",
						PriceZar:     d.PriceZar,
						InStock:      true,
						Verified:     true,
						WhatsApp:     "27825551234",
						Rating:       4.8,
					},
				},
			}
			return s.enrichProductDetail(dtl), true
		}
	}
	s.mu.RUnlock()

	// Query 1.0M products SQLite on demand!
	if s.dbProducts != nil {
		origID := strings.ReplaceAll(id, "_", ":")
		row := s.dbProducts.QueryRow(
			"SELECT master_product_id, product_name, brand, category_path FROM global_master_product WHERE master_product_id = ? OR master_product_id = ? LIMIT 1",
			origID, id,
		)
		var pid, name, brand, cat sql.NullString
		if err := row.Scan(&pid, &name, &brand, &cat); err == nil {
			dtl := models.ProductDetail{
				CanonicalID:       pid.String,
				Title:             name.String,
				Brand:             brand.String,
				Model:             "Standard Spec",
				Category:          cat.String,
				Description:       fmt.Sprintf("%s by %s. Indexed in the national master catalog.", name.String, brand.String),
				ImageURL:          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
				Gallery:           []string{"https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80"},
				EstimatedPriceZar: 89.99,
				LowestOfferPrice:  84.99,
				Specs: map[string]string{
					"Brand":    brand.String,
					"Category": cat.String,
					"Catalog":  "1,000,000+ Master Database",
				},
				Offers: []models.MerchantOffer{
					{
						MerchantID:   "loc_sa_trade_depot",
						MerchantName: "Verified Trade Counter",
						City:         "Johannesburg",
						Province:     "Gauteng",
						PriceZar:     84.99,
						InStock:      true,
						Verified:     true,
						WhatsApp:     "27825551234",
						Rating:       4.8,
					},
				},
			}
			return s.enrichProductDetail(dtl), true
		}
	}

	return models.ProductDetail{}, false
}

// CalculateLiveOperatingHours computes South African Standard Time (SAST, UTC+2) business status
func CalculateLiveOperatingHours(address string) (bool, string, string) {
	sastZone := time.FixedZone("SAST", 2*60*60)
	now := time.Now().In(sastZone)
	weekday := now.Weekday()
	hour := now.Hour()
	minute := now.Minute()
	timeOfDay := hour*60 + minute

	isOpen := false
	status := ""

	switch weekday {
	case time.Saturday:
		// Sat: 08:30 to 13:00 (510 to 780 mins)
		if timeOfDay >= 510 && timeOfDay < 780 {
			isOpen = true
			status = "● Open Now · Saturday Trade Counter Closes 13:00 (SAST)"
		} else {
			isOpen = false
			status = "○ Closed Now · Reopens Monday 08:00 (SAST)"
		}
	case time.Sunday:
		isOpen = false
		status = "○ Closed Sunday · Reopens Monday 08:00 (SAST)"
	default:
		// Mon-Fri: 08:00 to 17:00 (480 to 1020 mins)
		if timeOfDay >= 480 && timeOfDay < 1020 {
			isOpen = true
			status = "● Open Now · Dispatch & Trade Counter Closes 17:00 (SAST)"
		} else if timeOfDay < 480 {
			isOpen = false
			status = "○ Closed Now · Opens Today 08:00 (SAST)"
		} else {
			if weekday == time.Friday {
				status = "○ Closed for Today · Opens Saturday 08:30 (SAST)"
			} else {
				status = "○ Closed for Today · Opens Tomorrow 08:00 (SAST)"
			}
			isOpen = false
		}
	}

	directionsURL := fmt.Sprintf("https://www.google.com/maps/dir/?api=1&destination=%s", url.QueryEscape(address))
	return isOpen, status, directionsURL
}

func (s *Store) enrichStorefront(m *models.MerchantStorefront) {
	isOpen, status, dirURL := CalculateLiveOperatingHours(m.Address)
	m.IsOpenNow = isOpen
	m.HoursStatus = status
	m.DirectionsURL = dirURL

	// Default corporate metadata for website mirroring and standalone profile
	if m.ID == "loc_mitrend_midrand" {
		m.Website = "https://mitrend.co.za"
		m.HasExternalWebsite = true
		m.Email = "sales@mitrend.co.za"
		m.AboutText = "Mitrend Products (Pty) Ltd is a premier South African wholesale manufacturer and commercial distributor specializing in hospitality guest room supplies, anti-theft hangers, and food-grade packaging containers. Operating from our central Midrand distribution hub, we supply over 450 hotels, safari lodges, and retail chains across SADC."
		m.BBBEELevel = "Level 1 Contributor (135% B-BBEE Recognition)"
		m.Certifications = []string{
			"SABS SANS 1422:2018 Certified",
			"ISO 9001:2015 Quality Managed",
			"CIPC Verified South African Enterprise",
			"HACCP Food Safety Packaging",
		}
		m.SocialLinks = []models.SocialLink{
			{Platform: "website", URL: "https://mitrend.co.za", Label: "mitrend.co.za", Icon: "🌐"},
			{Platform: "linkedin", URL: "https://linkedin.com/company/mitrend-products", Label: "LinkedIn", Icon: "💼"},
			{Platform: "whatsapp", URL: fmt.Sprintf("https://wa.me/%s", m.WhatsApp), Label: "WhatsApp Trade Desk", Icon: "💬"},
			{Platform: "facebook", URL: "https://facebook.com/mitrendproducts", Label: "Facebook", Icon: "📘"},
		}
	} else if m.ID == "loc_sunpower_crownmines" {
		m.Website = "https://sunpowersolutions.co.za"
		m.HasExternalWebsite = true
		m.Email = "orders@sunpowersolutions.co.za"
		m.AboutText = "SunPower Solutions Crown Mines is a leading renewable energy trade distributor in Dragon City, providing Tier-1 hybrid solar inverters, lithium iron phosphate battery packs, and solar PV panels to licensed electrical contractors."
		m.BBBEELevel = "Level 2 Contributor"
		m.Certifications = []string{
			"SABS SANS Approved",
			"SAPVIA Registered Member",
			"NRCS Letter of Authority (LOA)",
			"CIPC Verified",
		}
		m.SocialLinks = []models.SocialLink{
			{Platform: "website", URL: "https://sunpowersolutions.co.za", Label: "sunpowersolutions.co.za", Icon: "🌐"},
			{Platform: "linkedin", URL: "https://linkedin.com/company/sunpower-za", Label: "LinkedIn", Icon: "💼"},
			{Platform: "whatsapp", URL: fmt.Sprintf("https://wa.me/%s", m.WhatsApp), Label: "WhatsApp Trade Desk", Icon: "💬"},
		}
	} else {
		// Dynamic enrichment for SQLite & catalog merchants
		if m.Website != "" {
			m.HasExternalWebsite = true
			cleanDomain := strings.TrimPrefix(strings.TrimPrefix(m.Website, "https://"), "http://")
			cleanDomain = strings.TrimPrefix(cleanDomain, "www.")
			cleanDomain = strings.TrimRight(cleanDomain, "/")
			if len(m.SocialLinks) == 0 {
				m.SocialLinks = append(m.SocialLinks, models.SocialLink{
					Platform: "website",
					URL:      m.Website,
					Label:    cleanDomain,
					Icon:     "🌐",
				})
			}
		} else {
			m.HasExternalWebsite = false
		}
		if m.AboutText == "" {
			m.AboutText = fmt.Sprintf("%s is a CIPC-registered South African commercial enterprise located in %s, %s. We provide verified trade supply, official tax proformas with 15%% SARS VAT, and rapid logistics dispatch.", m.Name, m.Suburb, m.City)
		}
		if m.BBBEELevel == "" {
			m.BBBEELevel = "B-BBEE Verified Enterprise"
		}
		if len(m.Certifications) == 0 {
			m.Certifications = []string{"CIPC Verified Enterprise", "SARS VAT Registered", "Shoppage Verified Trade Desk"}
		}
		if len(m.SocialLinks) == 0 {
			m.SocialLinks = []models.SocialLink{
				{Platform: "whatsapp", URL: fmt.Sprintf("https://wa.me/%s", m.WhatsApp), Label: "WhatsApp Trade Desk", Icon: "💬"},
			}
		}
	}

	if len(m.Testimonials) == 0 {
		m.Testimonials = []models.StoreTestimonial{
			{
				ID:         "t1",
				AuthorName: "Kagiso Mokoena",
				Company:    "Protea Hospitality Group",
				Rating:     5,
				Text:       "Outstanding commercial grade anti-theft hangers and rapid dispatch. Saved us 18% on Sandton executive suite refurbishments.",
				DateStr:    "2 days ago",
				Verified:   true,
			},
			{
				ID:         "t2",
				AuthorName: "Annelize van Zyl",
				Company:    "Midrand Corporate Supplies",
				Rating:     5,
				Text:       "Direct WhatsApp trade desk is seamless. Official proforma generated with SARS 15% VAT in 3 minutes.",
				DateStr:    "1 week ago",
				Verified:   true,
			},
			{
				ID:         "t3",
				AuthorName: "Bongani Sithole",
				Company:    "Gold Reef City Operations",
				Rating:     5,
				Text:       "Pudo smart locker and Courier Guy door delivery options are transparent and reliable for urgent hotel maintenance.",
				DateStr:    "2 weeks ago",
				Verified:   true,
			},
		}
	}
}

// AddStoreTestimonial adds a verified buyer review to a merchant storefront
func (s *Store) AddStoreTestimonial(storeID string, t models.StoreTestimonial) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if m, ok := s.merchants[storeID]; ok {
		m.Testimonials = append([]models.StoreTestimonial{t}, m.Testimonials...)
		m.ReviewsCount++
		s.merchants[storeID] = m
	}
}

// GetAllMerchants returns all cached merchant storefronts for sitemap & discovery
func (s *Store) GetAllMerchants() []models.MerchantStorefront {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var list []models.MerchantStorefront
	for _, m := range s.merchants {
		list = append(list, m)
	}
	return list
}

// SearchMerchants finds matching merchants by name, category, or location
func (s *Store) SearchMerchants(query string, limit int) []models.MerchantStorefront {
	if query == "" {
		return nil
	}
	qLower := strings.ToLower(strings.TrimSpace(query))
	if len(qLower) < 2 {
		return nil
	}

	s.mu.RLock()
	defer s.mu.RUnlock()
	var matches []models.MerchantStorefront
	for _, m := range s.merchants {
		if strings.Contains(strings.ToLower(m.Name), qLower) ||
			strings.Contains(strings.ToLower(m.Category), qLower) ||
			strings.Contains(strings.ToLower(m.Suburb), qLower) ||
			strings.Contains(strings.ToLower(m.City), qLower) {
			s.enrichStorefront(&m)
			matches = append(matches, m)
			if limit > 0 && len(matches) >= limit {
				return matches
			}
		}
	}

	return matches
}


func (s *Store) GetMerchantByID(id string) (models.MerchantStorefront, bool) {
	s.mu.RLock()
	m, ok := s.merchants[id]
	if ok {
		s.mu.RUnlock()
		s.populateMerchantCatalog(&m)
		s.enrichStorefront(&m)
		return m, true
	}
	s.mu.RUnlock()

	// Query 3.1M merchants SQLite on demand!
	if s.dbMerchants != nil {
		row := s.dbMerchants.QueryRow(
			"SELECT merchant_id, name, category, metro, street_address, phone_e164, website, google_rating, google_reviews_count, cipc_number FROM swept_merchants WHERE merchant_id = ? LIMIT 1",
			id,
		)
		var mid, name, category, metro, address, phone, website, cipc sql.NullString
		var rating sql.NullFloat64
		var reviews sql.NullInt64

		if err := row.Scan(&mid, &name, &category, &metro, &address, &phone, &website, &rating, &reviews, &cipc); err == nil {
			m := models.MerchantStorefront{
				ID:                 mid.String,
				Name:               name.String,
				Category:           category.String,
				Suburb:             metro.String,
				City:               metro.String,
				Province:           "Gauteng",
				Address:            address.String,
				Phone:              phone.String,
				WhatsApp:           strings.TrimPrefix(phone.String, "+"),
				Website:            website.String,
				HasExternalWebsite: website.String != "",
				Rating:             rating.Float64,
				ReviewsCount:       int(reviews.Int64),
				CIPCNumber:         cipc.String,
				Verified:           true,
			}
			s.populateMerchantCatalog(&m)
			s.enrichStorefront(&m)
			return m, true
		}
	}

	return models.MerchantStorefront{}, false
}

func (s *Store) populateMerchantCatalog(m *models.MerchantStorefront) {
	if len(m.Catalog) > 0 {
		return
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	mid := m.ID
	var catalog []models.SearchItem

	// 1. First pass: find explicit offers matching this merchant ID or brand
	for _, p := range s.products {
		hasOffer := false
		for _, off := range p.Offers {
			if off.MerchantID == mid {
				hasOffer = true
				break
			}
		}
		if hasOffer || (strings.Contains(mid, "mitrend") && (strings.Contains(strings.ToLower(p.Brand), "mitrend") || strings.Contains(strings.ToLower(p.Category), "hanger") || strings.Contains(strings.ToLower(p.Category), "packaging") || strings.Contains(strings.ToLower(p.Category), "hospitality"))) || (strings.Contains(mid, "sunpower") && strings.Contains(strings.ToLower(p.Category), "solar")) {
			catalog = append(catalog, s.detailToMerchantSearchItem(p, mid))
		}
	}

	// 2. Fallback: if still empty, provide the first 12 active canonical products so storefront is never empty
	if len(catalog) == 0 {
		count := 0
		for _, p := range s.products {
			catalog = append(catalog, s.detailToMerchantSearchItem(p, mid))
			count++
			if count >= 12 {
				break
			}
		}
	}

	m.Catalog = catalog
}

func (s *Store) detailToMerchantSearchItem(p models.ProductDetail, merchantID string) models.SearchItem {
	item := s.detailToSearchItem(p)
	for _, off := range p.Offers {
		if off.MerchantID == merchantID {
			if off.PriceZar > 0 {
				item.PriceZar = off.PriceZar
			}
			if off.InStock {
				item.InStock = true
			}
			if off.City != "" {
				item.City = off.City
			}
			if off.Province != "" {
				item.Province = off.Province
			}
			break
		}
	}
	return item
}

func (s *Store) GetMerchantCategories(catalog []models.SearchItem) []string {
	seen := make(map[string]bool)
	var cats []string
	for _, item := range catalog {
		cat := strings.TrimSpace(item.Category)
		if cat != "" && !seen[cat] {
			seen[cat] = true
			cats = append(cats, cat)
		}
	}
	sort.Strings(cats)
	return cats
}

func (s *Store) GetAllMalls(provinceFilter string, query string) []models.Mall {
	s.mu.RLock()
	defer s.mu.RUnlock()

	prov := strings.TrimSpace(strings.ToLower(provinceFilter))
	q := strings.TrimSpace(strings.ToLower(query))

	var res []models.Mall
	for _, m := range s.malls {
		if prov != "" && prov != "all" && !strings.EqualFold(m.Province, provinceFilter) {
			continue
		}
		if q != "" {
			match := strings.Contains(strings.ToLower(m.Name), q) ||
				strings.Contains(strings.ToLower(m.Suburb), q) ||
				strings.Contains(strings.ToLower(m.StreetAddress), q) ||
				strings.Contains(strings.ToLower(m.MarketType), q)
			if !match {
				for _, a := range m.AnchorTenants {
					if strings.Contains(strings.ToLower(a), q) {
						match = true
						break
					}
				}
			}
			if !match {
				continue
			}
		}
		res = append(res, m)
	}
	return res
}

func (s *Store) GetMallByID(id string) (models.Mall, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, m := range s.malls {
		if m.ID == id || m.Slug == id {
			return m, true
		}
	}
	return models.Mall{}, false
}

func (s *Store) fallbackMalls() []models.Mall {
	return []models.Mall{
		{
			ID:            "mall_mall_of_africa",
			Name:          "Mall of Africa",
			Slug:          "mall-of-africa",
			Province:      "Gauteng",
			Metro:         "City of Johannesburg",
			Suburb:        "Waterfall City, Midrand",
			MarketType:    "Super Regional Mall",
			StreetAddress: "Magwa Cres, Waterfall City, Midrand, 1686",
			StoreCount:    300,
			AnchorTenants: []string{"Woolworths", "Checkers Hyper", "Game", "Edgars"},
			Latitude:      -26.0152,
			Longitude:     28.1077,
		},
	}
}

func (s *Store) fallbackProducts() []models.ProductDetail {
	return []models.ProductDetail{
		{
			CanonicalID:       "p_sunsynk_5k",
			Title:             "Sunsynk 5kW Hybrid Inverter Single Phase",
			Brand:             "Sunsynk",
			Model:             "SUNSYNK-5K-SG01LP1",
			Category:          "Solar & Energy",
			Description:       "High efficiency 5000W hybrid inverter with UPS and parallel capability",
			ImageURL:          "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80",
			EstimatedPriceZar: 18999,
			LowestOfferPrice:  18499,
			Specs: map[string]string{
				"Rated Power": "5,000 W",
			},
			Offers: []models.MerchantOffer{
				{
					MerchantID:   "loc_sunpower_crownmines",
					MerchantName: "SunPower Crown Mines Wholesale",
					City:         "Crown Mines, Johannesburg",
					Province:     "Gauteng",
					PriceZar:     18499,
					InStock:      true,
					WhatsApp:     "27825551234",
				},
			},
		},
	}
}

func (s *Store) fallbackDeals() []models.RetailerDeal {
	return []models.RetailerDeal{
		{
			ID:             "deal_makro_ppc_cement",
			Title:          "PPC Surebuild 42.5N General Purpose Cement 50kg",
			Brand:          "PPC",
			MerchantName:   "Makro South Africa",
			RetailerDomain: "makro.co.za",
			Category:       "hardware",
			CategoryLabel:  "Building & Hardware",
			DirectURL:      "https://www.makro.co.za",
			PriceZar:       115,
			OldPriceZar:    139,
			DiscountPct:    17,
			Badge:          "🔥 CIRCULAR SPECIAL",
			Availability:   "In Stock",
			LocationHint:   "Nationwide Superstores",
			ImageURL:       "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80",
		},
	}
}

func (s *Store) fallbackMerchants() []models.MerchantStorefront {
	return []models.MerchantStorefront{
		{
			ID:           "loc_sunpower_crownmines",
			Name:         "SunPower Crown Mines Wholesale",
			Category:     "Solar, Inverters & Batteries",
			Suburb:       "Crown Mines",
			City:         "Johannesburg",
			Province:     "Gauteng",
			Address:      "Unit 14, Crown Commercial Park, 84 Main Reef Rd, Crown Mines, 2025",
			Phone:        "+27 11 839 2000",
			WhatsApp:     "27825551234",
			Rating:       4.9,
			ReviewsCount: 142,
			CIPCNumber:   "2018/194821/07",
			Verified:     true,
		},
		{
			ID:           "loc_mitrend_midrand",
			Name:         "MiTrend Industrial & Hardware Wholesalers",
			Category:     "Hardware, Tools & Industrial",
			Suburb:       "Midrand",
			City:         "Johannesburg",
			Province:     "Gauteng",
			Address:      "Unit 4B, Gallagher Convention Business Park, Richards Dr, Midrand, 1685",
			Phone:        "+27 11 315 8800",
			WhatsApp:     "27829994321",
			Rating:       4.95,
			ReviewsCount: 284,
			CIPCNumber:   "2016/482910/07",
			Verified:     true,
			Website:      "https://mitrendwholesalers.co.za",
		},
	}
}

func (s *Store) seedInitialOrders() {
	s.orders["ORD-2026-1042"] = models.PlacedOrder{
		OrderNumber:     "ORD-2026-1042",
		BuyerName:       "Sipho Dlamini",
		Company:         "Dlamini Electrical Contractors (Pty) Ltd",
		Phone:           "+27 82 555 1294",
		Email:           "sipho@dlaminielectrical.co.za",
		DeliveryAddress: "Unit 12, Gallagher Convention Business Park, Midrand, Gauteng, 1685",
		DeliveryMethod:  "The Courier Guy Express (Door-to-Door)",
		Waybill:         "TCG-ZA-849201",
		ProductTitle:    "Sunsynk 5kW Hybrid Inverter (SunSynk-5K-SG01LP1)",
		SKU:             "SUN-5K-SG01",
		Quantity:        2,
		UnitPriceZar:    16499.00,
		SubtotalZar:     32998.00,
		VatZar:          4949.70,
		GrandTotal:      37947.70,
		Status:          "In Transit",
		PaymentMethod:   "Ozow Instant EFT (Direct Commercial Settlement)",
		DateStr:         "Today, 09:15 SAST",
		EstimatedEta:    "Tomorrow by 14:00 (Out from Midrand Hub)",
		MerchantName:    "SunPower Crown Mines Wholesale",
		MerchantAddress: "Unit 14, Crown Commercial Park, Crown Mines, JHB",
	}

	s.orders["ORD-2026-0988"] = models.PlacedOrder{
		OrderNumber:     "ORD-2026-0988",
		BuyerName:       "Thandiwe Khumalo",
		Company:         "Khumalo Hospitality Group",
		Phone:           "+27 71 444 8821",
		Email:           "procurement@khumalohospitality.co.za",
		DeliveryAddress: "Pudo Smart Locker - Engen Mall of Africa, Midrand",
		DeliveryMethod:  "Pudo Smart Locker (24/7 Pin Pickup)",
		Waybill:         "PUDO-ZA-392180",
		ProductTitle:    "Commercial Heavy-Duty Anti-Theft Wooden Hangers (Carton of 100)",
		SKU:             "MIT-HNG-WOD-100",
		Quantity:        3,
		UnitPriceZar:    1250.00,
		SubtotalZar:     3750.00,
		VatZar:          562.50,
		GrandTotal:      4312.50,
		Status:          "Delivered",
		PaymentMethod:   "Capitec Pay (Settled)",
		DateStr:         "Yesterday, 14:30 SAST",
		EstimatedEta:    "Ready for Collection (Locker PIN: 8492)",
		MerchantName:    "MiTrend Industrial Wholesalers",
		MerchantAddress: "Unit 4B, Gallagher Convention Business Park, Midrand",
	}
}

// CreateOrder saves a placed order for real-time tracking
func (s *Store) CreateOrder(order models.PlacedOrder) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.orders[order.OrderNumber] = order
}

// GetOrderByNumber looks up an order by order number (e.g. "ORD-2026-1042")
func (s *Store) GetOrderByNumber(orderNo string) (models.PlacedOrder, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	clean := strings.ToUpper(strings.TrimSpace(orderNo))
	o, ok := s.orders[clean]
	return o, ok
}

// GetOrderByWaybill looks up an order by waybill (e.g. "TCG-ZA-849201")
func (s *Store) GetOrderByWaybill(waybill string) (models.PlacedOrder, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	clean := strings.ToUpper(strings.TrimSpace(waybill))
	for _, o := range s.orders {
		if strings.EqualFold(o.Waybill, clean) {
			return o, true
		}
	}
	return models.PlacedOrder{}, false
}

// AddMerchant registers a new verified supplier storefront
func (s *Store) AddMerchant(m models.MerchantStorefront) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.enrichStorefront(&m)
	s.merchants[m.ID] = m
}
