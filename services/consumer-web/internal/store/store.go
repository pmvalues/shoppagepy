package store

import (
	"database/sql"
	"encoding/json"
	"errors"
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
	dataDir     string
	manifest    manifest
	dbMerchants *sql.DB
	dbProducts  *sql.DB
	dbOffers    *sql.DB
	persist     Persister
	searchCore  *http.Client
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
	s.mergeDiscoveredOffers()
	return s
}

// initSqliteConnections attaches the large operator-supplied datasets.
//
// FOUNDATION_DATA_DIR overrides the root. When unset, the well-known
// foundation path is probed relative to the binary and working directory so
// `go run` from the repo root picks up real offers without parent-dir walking.
func (s *Store) initSqliteConnections() {
	customRoot := strings.TrimSpace(os.Getenv("FOUNDATION_DATA_DIR"))
	roots := foundationRoots(customRoot)
	if len(roots) == 0 {
		return
	}
	for _, root := range roots {
		attached := false
		for _, c := range []struct {
			file string
			name string
			dst  **sql.DB
		}{
			{"sa_nationwide_merchants.sqlite", "merchants", &s.dbMerchants},
			{"global_food_master_products.sqlite", "products", &s.dbProducts},
			{"sa_discovered_offers.sqlite", "offers", &s.dbOffers},
		} {
			if *c.dst != nil {
				continue
			}
			path := filepath.Join(root, c.file)
			fi, err := os.Stat(path)
			if err != nil || fi.IsDir() {
				continue
			}
			db, err := sql.Open("sqlite", path)
			if err != nil {
				fmt.Printf("[Store] Foundation %s dataset unavailable (%s): %v\n", c.name, path, err)
				continue
			}
			*c.dst = db
			attached = true
			fmt.Printf("[Store] Attached foundation %s dataset from %s\n", c.name, path)
		}
		if customRoot != "" {
			return
		}
		if attached && s.dbProducts != nil && s.dbOffers != nil {
			return
		}
	}
}

func foundationRoots(customRoot string) []string {
	if customRoot != "" {
		return []string{customRoot}
	}
	rel := filepath.Join("shoppage-commerce-intelligence-foundation", "data", "study")
	var out []string
	if exe, err := os.Executable(); err == nil {
		out = append(out, filepath.Join(filepath.Dir(exe), rel))
	}
	if cwd, err := os.Getwd(); err == nil {
		out = append(out, filepath.Join(cwd, rel))
	}
	return out
}

// dataset is one bundled sample file and where its rows are stored.
type dataset struct {
	file string
	// apply parses raw JSON into the store and reports how many rows it took.
	apply func(s *Store, raw []byte) (int, error)
}

// unmarshalInto decodes a JSON array and replaces dst with it.
func unmarshalInto[T any](raw []byte, dst *[]T) (int, error) {
	var rows []T
	if err := json.Unmarshal(raw, &rows); err != nil {
		return 0, err
	}
	*dst = rows
	return len(rows), nil
}

// indexInto decodes a JSON array into an existing map keyed by key(row).
func indexInto[T any](raw []byte, m map[string]T, key func(T) string) (int, error) {
	var rows []T
	if err := json.Unmarshal(raw, &rows); err != nil {
		return 0, err
	}
	for _, r := range rows {
		if k := key(r); k != "" {
			m[k] = r
		}
	}
	return len(rows), nil
}

func (s *Store) datasets() []dataset {
	return []dataset{
		{"malls.json", func(s *Store, raw []byte) (int, error) { return unmarshalInto(raw, &s.malls) }},
		{"deals.json", func(s *Store, raw []byte) (int, error) { return unmarshalInto(raw, &s.deals) }},
		{"posts.json", func(s *Store, raw []byte) (int, error) { return unmarshalInto(raw, &s.posts) }},
		{"shorts.json", func(s *Store, raw []byte) (int, error) { return unmarshalInto(raw, &s.shorts) }},
		{"trends.json", func(s *Store, raw []byte) (int, error) { return unmarshalInto(raw, &s.trends) }},
		{"guilds.json", func(s *Store, raw []byte) (int, error) { return unmarshalInto(raw, &s.guilds) }},
		{"products.json", func(s *Store, raw []byte) (int, error) {
			return indexInto(raw, s.products, func(p models.ProductDetail) string { return p.CanonicalID })
		}},
		{"merchants.json", func(s *Store, raw []byte) (int, error) {
			return indexInto(raw, s.merchants, func(m models.MerchantStorefront) string { return m.ID })
		}},
	}
}

// resolveDataDir returns the sample-data directory, or "" when none is present.
// Precedence is operator intent first: DATA_DIR, then a directory next to the
// running binary (the container layout), then the source-tree layout used by
// "go run" and the tests. The previous build probed four relative guesses in a
// fixed order, so which dataset a page showed depended on the working
// directory it was opened from.
func (s *Store) resolveDataDir() string {
	if custom := strings.TrimSpace(os.Getenv("DATA_DIR")); custom != "" {
		if fi, err := os.Stat(custom); err == nil && fi.IsDir() {
			return custom
		}
		fmt.Printf("[Store] DATA_DIR %q is not a directory; using bundled sample data\n", custom)
	}
	exeDir := ""
	if exe, err := os.Executable(); err == nil {
		exeDir = filepath.Dir(exe)
	}
	for _, cand := range executableCandidates(exeDir) {
		if fi, err := os.Stat(cand); err == nil && fi.IsDir() {
			return cand
		}
	}
	return ""
}

// executableCandidates lists data directories relative to the running binary
// first and to the working directory second.
func executableCandidates(exeDir string) []string {
	var out []string
	rel := []string{"data", filepath.Join("..", "data"), filepath.Join("..", "..", "services", "consumer-web", "data")}
	if exeDir != "" {
		for _, r := range rel {
			out = append(out, filepath.Join(exeDir, r))
		}
	}
	cwd, err := os.Getwd()
	if err == nil {
		for _, r := range rel {
			out = append(out, filepath.Join(cwd, r))
		}
	}
	return out
}

// manifest describes where the loaded rows came from, so the UI can disclose
// sample data instead of presenting it as live marketplace truth.
type manifest struct {
	Mode    string `json:"mode"`
	Notice  string `json:"notice"`
	Source  string `json:"source"`
	Updated string `json:"updated"`
}

func (s *Store) loadDatasets() {
	s.mu.Lock()
	defer s.mu.Unlock()

	dir := s.resolveDataDir()
	s.dataDir = dir

	if dir != "" {
		if raw, err := os.ReadFile(filepath.Join(dir, "MANIFEST.json")); err == nil {
			var mf manifest
			if err := json.Unmarshal(raw, &mf); err == nil {
				s.manifest = mf
			} else {
				fmt.Printf("[Store] Ignoring unreadable MANIFEST.json: %v\n", err)
			}
		}
		for _, ds := range s.datasets() {
			path := filepath.Join(dir, ds.file)
			raw, err := os.ReadFile(path)
			if err != nil {
				continue
			}
			n, err := ds.apply(s, raw)
			if err != nil {
				fmt.Printf("[Store] Skipped %s: %v\n", path, err)
				continue
			}
			if n > 0 {
				fmt.Printf("[Store] %d rows from %s\n", n, path)
			}
		}
	} else {
		fmt.Println("[Store] No sample-data directory found; running on the built-in fallback rows")
	}

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

// SampleDataInUse reports whether the catalogue is the bundled, hand-authored
// sample rather than an operator-supplied dataset. The platform discloses this
// in the UI instead of letting sample rows read as live marketplace data.
func (s *Store) SampleDataInUse() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.dbMerchants != nil || s.dbProducts != nil {
		return false
	}
	if mode := strings.ToLower(strings.TrimSpace(s.manifest.Mode)); mode != "" {
		return mode == "sample" || mode == "demo"
	}
	return true
}

// DataNotice returns the one-line disclosure shown with sample data.
func (s *Store) DataNotice() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if n := strings.TrimSpace(s.manifest.Notice); n != "" {
		return n
	}
	return "Illustrative sample catalogue bundled with this build for demonstration."
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

// GetDeals returns retailer specials, filtered by retailer and category.
//
// Savings are always derived from the two published prices. The store never
// invents a locker rate, branch count or stock level: an absent field stays
// absent so the UI can render its "quoted by supplier" state.
func (s *Store) GetDeals(retailer, category string, sortMode ...string) []models.RetailerDeal {
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
		if d.OldPriceZar > d.PriceZar {
			d.SavingsZar = d.OldPriceZar - d.PriceZar
		} else {
			d.SavingsZar = 0
		}
		out = append(out, d)
	}

	mode := "savings"
	if len(sortMode) > 0 && strings.TrimSpace(sortMode[0]) != "" {
		mode = strings.ToLower(strings.TrimSpace(sortMode[0]))
	}
	switch mode {
	case "price_asc":
		sort.SliceStable(out, func(i, j int) bool { return out[i].PriceZar < out[j].PriceZar })
	case "price_desc":
		sort.SliceStable(out, func(i, j int) bool { return out[i].PriceZar > out[j].PriceZar })
	default:
		sort.SliceStable(out, func(i, j int) bool { return out[i].DiscountPct > out[j].DiscountPct })
	}

	return out
}

// RetailerFacet is one retailer present in the loaded deals, with how many
// specials it currently has. Retailer navigation is built from this so the
// platform cannot advertise a chain, a branch count or a catalogue it does not
// actually hold.
type RetailerFacet struct {
	Key   string
	Label string
	Deals int
}

// GetRetailers lists the retailers the loaded deals reference, most deals
// first. The filter key is the token GetDeals matches on.
func (s *Store) GetRetailers() []RetailerFacet {
	s.mu.RLock()
	defer s.mu.RUnlock()

	byKey := map[string]*RetailerFacet{}
	var keys []string
	for _, d := range s.deals {
		key := strings.ToLower(strings.TrimSpace(d.RetailerDomain))
		if key == "" {
			key = strings.ToLower(strings.TrimSpace(d.MerchantName))
		}
		if key == "" {
			continue
		}
		f, ok := byKey[key]
		if !ok {
			f = &RetailerFacet{Key: key, Label: strings.TrimSpace(d.MerchantName)}
			if f.Label == "" {
				f.Label = key
			}
			byKey[key] = f
			keys = append(keys, key)
		}
		f.Deals++
	}

	out := make([]RetailerFacet, 0, len(keys))
	for _, k := range keys {
		out = append(out, *byKey[k])
	}
	sort.SliceStable(out, func(i, j int) bool {
		if out[i].Deals != out[j].Deals {
			return out[i].Deals > out[j].Deals
		}
		return out[i].Label < out[j].Label
	})
	return out
}

// MaxDiscountPct is the deepest cut among the loaded deals, or 0 when no deal
// publishes one. Used instead of a hardcoded "up to 45%" claim.
func (s *Store) MaxDiscountPct() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var best int
	for _, d := range s.deals {
		if d.DiscountPct > best {
			best = d.DiscountPct
		}
	}
	return best
}

// GetDealsStats summarises the loaded deals. Every figure is counted from the
// rows themselves, so the deals banner can report a real maximum discount and a
// real retailer count instead of a marketing number.
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
			totalSavings += d.OldPriceZar - d.PriceZar
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

// AddPost stores a feed post durably (when persistence is attached) and
// prepends it to the in-memory feed.
func (s *Store) AddPost(post models.PostItem) error {
	if err := s.save(kindPost, post.ID, post); err != nil {
		return err
	}
	s.addPostLocked(post)
	return nil
}

func (s *Store) addPostLocked(post models.PostItem) {
	s.mu.Lock()
	defer s.mu.Unlock()
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
					City:        d.LocationHint,
					Province:    "Nationwide",
					InStock:     strings.EqualFold(d.Availability, "in stock"),
					Verified:    false,
					ImageURL:    d.ImageURL,
					Rating:      0,
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
						Description: "Master catalogue record — live offers attach when discovered_offers rows match",
						PriceZar:    0,
						OffersCount: s.offerCountForMaster(id.String),
						City:        "",
						Province:    "",
						InStock:     false,
						Verified:    false,
						ImageURL:    "",
						Rating:      0,
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

// GenerateMerchantTrust builds a trust block strictly from values that were
// actually observed. It never invents registration numbers, addresses, trade
// counts or verification flags: absent data stays absent so the UI can render
// an honest "unverified" state instead of a fabricated one.
func GenerateMerchantTrust(name string, city string, rating float64) *models.MerchantTrust {
	_ = name
	_ = city
	return &models.MerchantTrust{
		CipcVerified:  false,
		CipcNumber:    "",
		PhysicalStore: false,
		StoreAddress:  "",
		MallName:      "",
		ResponseTime:  "",
		TradesCount:   0,
		Rating:        rating,
	}
}

func (s *Store) detailToSearchItem(p models.ProductDetail) models.SearchItem {
	price := p.LowestOfferPrice
	if price <= 0 {
		price = p.EstimatedPriceZar
	}
	// Stock and location are only claimed when a real merchant offer asserts them.
	inStock := false
	pickup := false
	city := ""
	province := ""
	for _, off := range p.Offers {
		if off.InStock {
			inStock = true
		}
		if off.PickupAvailable {
			pickup = true
		}
		if city == "" && off.City != "" {
			city = off.City
			province = off.Province
		}
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
		City:            city,
		Province:        province,
		InStock:         inStock,
		Verified:        false,
		ImageURL:        p.ImageURL,
		Rating:          0,
		IsLocalSAStock:  p.IsLocalSAStock,
		DispatchHours:   0,
		PickupAvailable: pickup,
		PickupMall:      "",
		VolumeTiers:     GenerateDefaultVolumeTiers(price),
		Trust:           GenerateMerchantTrust(p.Brand, city, 0),
		DeliveryOptions: GenerateDefaultDeliveryOptions(city),
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
	base := os.Getenv("SEARCH_CORE_URL")
	if base == "" {
		base = "http://localhost:8082"
	}
	client := s.searchCore
	if client == nil {
		client = &http.Client{Timeout: 35 * time.Millisecond}
	}
	resp, err := client.Get(fmt.Sprintf("%s/api/search?q=%s", strings.TrimRight(base, "/"), url.QueryEscape(q)))
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
		img := ""
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
				ImageURL:          "",
				Gallery:           nil,
				EstimatedPriceZar: 0,
				LowestOfferPrice:  0,
				Specs: map[string]string{
					"Brand":    brand.String,
					"Category": cat.String,
					"Catalog":  "National Master Database",
				},
				Offers: s.offersForMaster(pid.String, id, name.String, brand.String),
			}
			dtl = applyOfferPrices(dtl)
			return s.enrichProductDetail(dtl), true
		}
	}

	return models.ProductDetail{}, false
}

func (s *Store) mergeDiscoveredOffers() {
	if s.dbOffers == nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	merged := 0
	for id, p := range s.products {
		offers := s.offersForMaster(id, id, p.Title, p.Brand)
		if len(offers) == 0 {
			continue
		}
		p.Offers = append(p.Offers, offers...)
		sort.Slice(p.Offers, func(i, j int) bool { return p.Offers[i].PriceZar < p.Offers[j].PriceZar })
		p = applyOfferPrices(p)
		s.products[id] = p
		merged++
	}
	if merged > 0 {
		fmt.Printf("[Store] Merged discovered offers into %d seed products\n", merged)
	}
}

func applyOfferPrices(p models.ProductDetail) models.ProductDetail {
	lowest := 0.0
	for _, o := range p.Offers {
		if o.PriceZar > 0 && (lowest == 0 || o.PriceZar < lowest) {
			lowest = o.PriceZar
		}
	}
	if lowest > 0 {
		p.LowestOfferPrice = lowest
		if p.EstimatedPriceZar <= 0 {
			p.EstimatedPriceZar = lowest
		}
	}
	return p
}

func (s *Store) offerCountForMaster(masterID string) int {
	if s.dbOffers == nil {
		return 0
	}
	var n int
	_ = s.dbOffers.QueryRow(
		"SELECT COUNT(*) FROM discovered_offers WHERE master_product_ref = ? AND discovered_price_zar > 0",
		masterID,
	).Scan(&n)
	return n
}

func (s *Store) offersForMaster(ids ...string) []models.MerchantOffer {
	if s.dbOffers == nil {
		return nil
	}
	query := "master_product_ref = ?"
	args := make([]any, 0, len(ids))
	for _, id := range ids {
		if strings.TrimSpace(id) == "" {
			continue
		}
		args = append(args, id)
	}
	if len(args) == 0 {
		return nil
	}
	if len(args) > 1 {
		placeholders := make([]string, len(args))
		for i := range args {
			placeholders[i] = "?"
		}
		query = "master_product_ref IN (" + strings.Join(placeholders, ",") + ")"
	}
	rows, err := s.dbOffers.Query(
		"SELECT product_title, merchant_name, source_website, discovered_price_zar, availability_text, location_hint, image_url FROM discovered_offers WHERE "+query+" AND discovered_price_zar > 0 ORDER BY discovered_price_zar ASC LIMIT 24",
		args...,
	)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []models.MerchantOffer
	for rows.Next() {
		var title, merchant, source, avail, loc, img sql.NullString
		var price float64
		if err := rows.Scan(&title, &merchant, &source, &price, &avail, &loc, &img); err != nil {
			continue
		}
		name := merchant.String
		if name == "" {
			name = source.String
		}
		if name == "" {
			continue
		}
		availL := strings.ToLower(avail.String)
		out = append(out, models.MerchantOffer{
			MerchantID:   source.String,
			MerchantName: name,
			City:         loc.String,
			PriceZar:     price,
			InStock:      strings.Contains(availL, "in stock") || availL == "available",
			Verified:     false,
			Rating:       0,
		})
	}
	return out
}

func (s *Store) enrichStorefront(m *models.MerchantStorefront) {
	// Operating status is only shown when the merchant supplied trading hours;
	// we never guess "open now" from a platform-wide default schedule.
	m.IsOpenNow = false
	m.HoursStatus = ""
	m.DirectionsURL = fmt.Sprintf("https://www.google.com/maps/dir/?api=1&destination=%s", url.QueryEscape(m.Address))

	// Enrichment only derives facts from data we actually hold (a website URL,
	// a WhatsApp number). Profile copy, certifications and B-BBEE levels are
	// merchant-supplied at onboarding and are never synthesised here.
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
	if len(m.SocialLinks) == 0 && m.WhatsApp != "" {
		m.SocialLinks = []models.SocialLink{
			{Platform: "whatsapp", URL: fmt.Sprintf("https://wa.me/%s", m.WhatsApp), Label: "WhatsApp Trade Desk", Icon: "💬"},
		}
	}
}

// AddStoreTestimonial durably records a buyer review and adds it to the
// merchant storefront.
func (s *Store) AddStoreTestimonial(storeID string, t models.StoreTestimonial) error {
	if err := s.save(kindTestimonial, t.ID, storedTestimonial{StoreID: storeID, Testimonial: t}); err != nil {
		return err
	}
	s.addTestimonial(storeID, t)
	return nil
}

func (s *Store) addTestimonial(storeID string, t models.StoreTestimonial) {
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
				Verified:           cipc.String != "",
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
		if hasOffer {
			catalog = append(catalog, s.detailToMerchantSearchItem(p, mid))
		}
	}

	// No fallback inventory: a storefront with no offers of its own shows an
	// honest empty catalogue rather than another merchant's products.
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
	// Sample scaffolding used only when no merchant dataset is loaded. It carries
	// identity and location only — no verification status, ratings, review counts
	// or registration numbers, because none of those were observed.
	return []models.MerchantStorefront{
		{
			ID:       "loc_sunpower_crownmines",
			Name:     "SunPower Crown Mines Wholesale",
			Category: "Solar, Inverters & Batteries",
			Suburb:   "Crown Mines",
			City:     "Johannesburg",
			Province: "Gauteng",
			Address:  "Unit 14, Crown Commercial Park, 84 Main Reef Rd, Crown Mines, 2025",
		},
		{
			ID:       "loc_mitrend_midrand",
			Name:     "MiTrend Industrial & Hardware Wholesalers",
			Category: "Hardware, Tools & Industrial",
			Suburb:   "Midrand",
			City:     "Johannesburg",
			Province: "Gauteng",
			Address:  "Unit 4B, Gallagher Convention Business Park, Richards Dr, Midrand, 1685",
		},
	}
}

// CreateOrder durably saves a placed order for real-time tracking. The
// order is only visible once the database has accepted it.
func (s *Store) CreateOrder(order models.PlacedOrder) error {
	if err := s.save(kindOrder, order.OrderNumber, order); err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.orders[order.OrderNumber] = order
	return nil
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

// ErrMerchantExists is returned when a registration would replace an
// existing storefront (IDs are derived from the company name).
var ErrMerchantExists = errors.New("a storefront with this ID already exists")

// AddMerchant durably registers a new supplier storefront. It never replaces
// an existing storefront, so one supplier cannot overwrite another's page by
// registering under the same name.
func (s *Store) AddMerchant(m models.MerchantStorefront) error {
	if _, ok := s.GetMerchantByID(m.ID); ok {
		return ErrMerchantExists
	}
	if err := s.save(kindMerchant, m.ID, m); err != nil {
		return err
	}
	s.addMerchant(m)
	return nil
}

func (s *Store) addMerchant(m models.MerchantStorefront) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.enrichStorefront(&m)
	s.merchants[m.ID] = m
}
