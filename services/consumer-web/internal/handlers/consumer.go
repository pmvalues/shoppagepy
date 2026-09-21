package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/shoppage/consumer-web/internal/ai"
	"github.com/shoppage/consumer-web/internal/models"
	"github.com/shoppage/consumer-web/internal/store"
	"github.com/shoppage/consumer-web/internal/templates"
)

type ConsumerHandler struct {
	store *store.Store
	aiSvc *ai.AssistantService
}

func NewConsumerHandler(s *store.Store) *ConsumerHandler {
	return &ConsumerHandler{
		store: s,
		aiSvc: ai.NewAssistantService(s),
	}
}

// HandleHome renders the public landing page with GoogleHeader and dynamic DiscoveryFeed
func (h *ConsumerHandler) HandleHome(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	tab := r.URL.Query().Get("tab")
	category := r.URL.Query().Get("category")
	retailer := r.URL.Query().Get("retailer")
	province := r.URL.Query().Get("province")
	sort := r.URL.Query().Get("sort")
	q := r.URL.Query().Get("q")

	if tab == "" {
		tab = "foryou"
	}

	posts := h.store.GetFeedPosts(tab, q)
	products := h.store.SearchProducts(q, category, province, false)
	deals := h.store.GetDeals(retailer, category, sort)
	dealsStats := h.store.GetDealsStats()
	malls := h.store.GetAllMalls(province, q)
	shorts := h.store.GetShorts(category)
	trends := h.store.GetTrends()
	guilds := h.store.GetGuilds()
	topDrops := h.store.GetTopDrops(5)

	totalMalls, totalProducts, totalDeals, totalMerchants := h.store.GetTotalCounts()

	// Limit snapshot on home page
	if len(products) > 48 {
		products = products[:48]
	}
	if len(deals) > 48 {
		deals = deals[:48]
	}
	if len(malls) > 48 {
		malls = malls[:48]
	}

	latencyMs := float64(time.Since(start).Microseconds()) / 1000.0

	data := templates.HomeViewData{
		Title:           "South Africa Commercial Discovery Grid · 1,000,000+ Products",
		Description:     "Compare wholesale prices, live retailer specials, and verified suppliers across South Africa.",
		Query:           q,
		CurrentTab:      tab,
		CurrentCategory: category,
		CurrentRetailer: retailer,
		CurrentProvince: province,
		CurrentSort:     sort,
		AvgSavingsPct:   dealsStats.AvgDiscountPct,
		Posts:           posts,
		Products:        products,
		Deals:           deals,
		Malls:           malls,
		Shorts:          shorts,
		Trends:          trends,
		Guilds:          guilds,
		TopDrops:        topDrops,
		MallsCount:      totalMalls,
		ProductsCount:   totalProducts,
		MerchantsCount:  totalMerchants,
		DealsCount:      totalDeals,
		LatencyMs:       latencyMs,
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := templates.RenderHome(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// HandleBuyBoxDrawer handles slide-out BuyBox multi-merchant offer comparison
func (h *ConsumerHandler) HandleBuyBoxDrawer(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	product, ok := h.store.GetProductByID(id)
	if !ok {
		// Try finding in deals
		deals := h.store.GetDeals("", "")
		for _, d := range deals {
			if d.ID == id {
				product = models.ProductDetail{
					CanonicalID:       d.ID,
					Title:             d.Title,
					Brand:             d.Brand,
					Model:             d.MerchantName,
					Category:          d.CategoryLabel,
					Description:       fmt.Sprintf("%s · %s", d.Availability, d.LocationHint),
					ImageURL:          d.ImageURL,
					LowestOfferPrice:  d.PriceZar,
					EstimatedPriceZar: d.PriceZar,
					Offers: []models.MerchantOffer{
						{
							MerchantID:   d.RetailerDomain,
							MerchantName: d.MerchantName,
							City:         d.LocationHint,
							Province:     "Nationwide",
							PriceZar:     d.PriceZar,
							InStock:      true,
							LeadTimeDays: 0,
							Verified:     true,
							WhatsApp:     "27118392000",
							Rating:       4.9,
						},
					},
				}
				ok = true
				break
			}
		}
	}

	if !ok {
		http.NotFound(w, r)
		return
	}

	data := templates.BuyBoxViewData{
		Product:      product,
		Offers:       product.Offers,
		LowestPrice:  product.LowestOfferPrice,
		UserLocation: "President Park AH, Midrand",
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := templates.RenderBuyBoxDrawer(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// HandleBroadcastPost prepends a new trade post to the timeline
func (h *ConsumerHandler) HandleBroadcastPost(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}
	text := strings.TrimSpace(r.FormValue("text"))
	if text == "" {
		http.Error(w, "text is required", http.StatusBadRequest)
		return
	}

	var poll *models.PostPoll
	opt1 := strings.TrimSpace(r.FormValue("pollOpt1"))
	opt2 := strings.TrimSpace(r.FormValue("pollOpt2"))
	if opt1 != "" && opt2 != "" {
		poll = &models.PostPoll{
			Options: []models.PollOption{
				{Label: opt1, Votes: 0},
				{Label: opt2, Votes: 0},
			},
		}
		if opt3 := strings.TrimSpace(r.FormValue("pollOpt3")); opt3 != "" {
			poll.Options = append(poll.Options, models.PollOption{Label: opt3, Votes: 0})
		}
	}

	newPost := models.PostItem{
		ID:       fmt.Sprintf("usr_%d", time.Now().UnixMilli()),
		Name:     "You (Verified Trader)",
		Handle:   "@you_za",
		Avatar:   "g8",
		Initials: "Y",
		Verified: true,
		Time:     "just now",
		Badge:    &models.PostBadge{Label: "LIVE TRADE", Type: "drop"},
		Tabs:     []string{"foryou"},
		Text:     text,
		Poll:     poll,
		Stats: models.PostStats{
			Replies: 0,
			Reposts: 0,
			Likes:   0,
			Views:   "1",
		},
	}

	h.store.AddPost(newPost)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := templates.RenderNewPostCard(w, newPost); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// HandleLocationModal renders the interactive province & area switcher modal
func (h *ConsumerHandler) HandleLocationModal(w http.ResponseWriter, r *http.Request) {
	malls := h.store.GetAllMalls("Gauteng", "")
	if len(malls) > 6 {
		malls = malls[:6]
	}
	data := templates.LocationModalViewData{
		CurrentProvince: "Gauteng",
		Provinces: []string{
			"Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
			"Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape",
		},
		Malls: malls,
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := templates.RenderLocationModal(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// HandleSearch processes search queries and returns either the full page or HTMX partial
func (h *ConsumerHandler) HandleSearch(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	q := r.URL.Query().Get("q")
	tab := r.URL.Query().Get("tab")
	category := r.URL.Query().Get("category")
	province := r.URL.Query().Get("province")
	retailer := r.URL.Query().Get("retailer")
	inStockOnly := r.URL.Query().Get("in_stock") == "true"

	if tab == "" {
		tab = "all"
	}

	var products []models.SearchItem
	var deals []models.RetailerDeal

	if tab == "deals" || retailer != "" {
		deals = h.store.GetDeals(retailer, category)
		for _, d := range deals {
			if q != "" {
				qLower := strings.ToLower(q)
				if !strings.Contains(strings.ToLower(d.Title), qLower) &&
					!strings.Contains(strings.ToLower(d.Brand), qLower) &&
					!strings.Contains(strings.ToLower(d.MerchantName), qLower) {
					continue
				}
			}
			products = append(products, models.SearchItem{
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
	} else {
		products = h.store.SearchProducts(q, category, province, inStockOnly)
	}

	var matchingMerchants []models.MerchantStorefront
	var matchingMalls []models.Mall
	if q != "" {
		matchingMerchants = h.store.SearchMerchants(q, 3)
		allMalls := h.store.GetAllMalls("", q)
		if len(allMalls) > 3 {
			matchingMalls = allMalls[:3]
		} else {
			matchingMalls = allMalls
		}
	}

	latencyMs := float64(time.Since(start).Microseconds()) / 1000.0
	isHX := r.Header.Get("HX-Request") == "true"

	data := templates.SearchViewData{
		Title:             "Search Results",
		Description:       "Compare wholesale prices, verified businesses, and shopping centres across South Africa.",
		Query:             q,
		CurrentTab:        tab,
		Category:          category,
		Province:          province,
		Retailer:          retailer,
		InStockOnly:       inStockOnly,
		Products:          products,
		Deals:             deals,
		MatchingMerchants: matchingMerchants,
		MatchingMalls:     matchingMalls,
		LatencyMs:         latencyMs,
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := templates.RenderSearch(w, data, isHX); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// HandleProduct renders canonical product page and BuyBox comparison
func (h *ConsumerHandler) HandleProduct(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	product, ok := h.store.GetProductByID(id)
	if !ok {
		http.NotFound(w, r)
		return
	}

	data := templates.ProductViewData{
		Title:       product.Title,
		Description: product.Description,
		Query:       "",
		CurrentTab:  "all",
		Product:     product,
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := templates.RenderProductDetail(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// HandleMalls renders the nationwide shopping centres directory
func (h *ConsumerHandler) HandleMalls(w http.ResponseWriter, r *http.Request) {
	prov := r.URL.Query().Get("province")
	q := r.URL.Query().Get("q")
	malls := h.store.GetAllMalls(prov, q)
	totalMalls, _, _, _ := h.store.GetTotalCounts()

	displayMalls := malls
	if len(displayMalls) > 60 && (prov == "" || prov == "all") && q == "" {
		displayMalls = displayMalls[:60]
	}

	data := templates.MallsViewData{
		Title:       fmt.Sprintf("%d South African Malls & Commercial Hubs", totalMalls),
		Description: "Explore shopping centres, wholesale districts, and retail nodes in South Africa.",
		Query:       q,
		CurrentTab:  "malls",
		Province:    prov,
		Malls:       displayMalls,
		TotalCount:  totalMalls,
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := templates.RenderMalls(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// HandleMallDetail renders details for a specific mall
func (h *ConsumerHandler) HandleMallDetail(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	mall, ok := h.store.GetMallByID(id)
	if !ok {
		http.NotFound(w, r)
		return
	}

	totalMalls, _, _, _ := h.store.GetTotalCounts()
	data := templates.MallsViewData{
		Title:       mall.Name + " — Mall Directory",
		Description: mall.StreetAddress + " · " + mall.MarketType,
		Query:       "",
		CurrentTab:  "malls",
		Province:    mall.Province,
		Malls:       []models.Mall{mall},
		TotalCount:  totalMalls,
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := templates.RenderMalls(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// HandleStorefront renders a public merchant profile
func (h *ConsumerHandler) HandleStorefront(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	merchant, ok := h.store.GetMerchantByID(id)
	if !ok {
		http.NotFound(w, r)
		return
	}

	category := r.URL.Query().Get("category")
	q := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("q")))
	sortParam := r.URL.Query().Get("sort")
	inStockOnly := r.URL.Query().Get("in_stock") == "true"

	allCategories := h.store.GetMerchantCategories(merchant.Catalog)
	totalCount := len(merchant.Catalog)

	// Filter catalog
	var filtered []models.SearchItem
	for _, item := range merchant.Catalog {
		if category != "" && category != "All" && !strings.EqualFold(item.Category, category) {
			continue
		}
		if q != "" {
			combined := strings.ToLower(item.Title + " " + item.Description + " " + item.Brand + " " + item.Model + " " + item.Category)
			if !strings.Contains(combined, q) {
				continue
			}
		}
		if inStockOnly && !item.InStock {
			continue
		}
		filtered = append(filtered, item)
	}

	// Sort catalog
	switch sortParam {
	case "price-asc":
		sort.Slice(filtered, func(i, j int) bool { return filtered[i].PriceZar < filtered[j].PriceZar })
	case "price-desc":
		sort.Slice(filtered, func(i, j int) bool { return filtered[i].PriceZar > filtered[j].PriceZar })
	case "title-asc":
		sort.Slice(filtered, func(i, j int) bool { return filtered[i].Title < filtered[j].Title })
	}

	merchant.Catalog = filtered

	heroHeadline := "Hospitality, Packaging & Catering Wholesale Supplies"
	if strings.Contains(strings.ToLower(merchant.Category), "solar") || strings.Contains(strings.ToLower(merchant.ID), "sunpower") {
		heroHeadline = "Tier-1 Hybrid Inverters, Lithium Batteries & Renewable Energy Wholesale"
	} else if merchant.Category != "" {
		heroHeadline = fmt.Sprintf("%s · Commercial Supply & Wholesale Depot", merchant.Category)
	}

	announcementText := "⚡ Free commercial delivery on wholesale orders over R5,000 across Gauteng · Direct WhatsApp Trade Desk active"

	data := templates.StorefrontViewData{
		Title:            merchant.Name + " — Official B2B Storefront & Trade Desk",
		Description:      merchant.Address + " · CIPC: " + merchant.CIPCNumber + " · Direct WhatsApp Trade Desk",
		Query:            q,
		CurrentTab:       "stores",
		Store:            merchant,
		Categories:       allCategories,
		ActiveCategory:   category,
		Sort:             sortParam,
		InStockOnly:      inStockOnly,
		TotalCount:       totalCount,
		HeroHeadline:     heroHeadline,
		AnnouncementText: announcementText,
		AccentColor:      "#0e7c56",
		Testimonials:     merchant.Testimonials,
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if r.Header.Get("HX-Target") == "store-catalog-grid" {
		if err := templates.RenderStoreCatalogGrid(w, data); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	if err := templates.RenderStorefront(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// HandleManifest serves the PWA web app manifest
func (h *ConsumerHandler) HandleManifest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/manifest+json")
	manifest := map[string]any{
		"name":             "Shoppage South Africa",
		"short_name":       "Shoppage",
		"description":      "South Africa Commercial Search & Price Engine",
		"start_url":        "/",
		"display":          "standalone",
		"background_color": "#ffffff",
		"theme_color":      "#059669",
		"icons": []map[string]string{
			{
				"src":   "/favicon.svg",
				"sizes": "any",
				"type":  "image/svg+xml",
			},
		},
	}
	json.NewEncoder(w).Encode(manifest)
}

// HandleFavicon serves the classic Shoppage emerald bag & lightning bolt favicon
func (h *ConsumerHandler) HandleFavicon(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "image/svg+xml")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	svg := `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="sp-brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="sp-bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#sp-brand-grad)"/>
  <path d="M8.5 12C8.5 10.8954 9.39543 10 10.5 10H21.5C22.6046 10 23.5 10.8954 23.5 12L24.5 24C24.5 25.1046 23.6046 26 22.5 26H9.5C8.39543 26 7.5 25.1046 7.5 24L8.5 12Z" fill="#FFFFFF"/>
  <path d="M12 10V7.5C12 5.567 13.567 4 15.5 4H16.5C18.433 4 20 5.567 20 7.5V10" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M17 12L12 18H16L15 24L20 17H16.2L17 12Z" fill="url(#sp-bolt-grad)"/>
</svg>`
	w.Write([]byte(svg))
}

// HandleServiceWorker serves the PWA service worker script
func (h *ConsumerHandler) HandleServiceWorker(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/javascript")
	sw := `
const CACHE_NAME = 'shoppage-v1';
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});
self.addEventListener('fetch', (e) => {
  // Pass-through network requests with sub-5ms caching for static assets
  if (e.request.url.includes('/static/')) {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(e.request).then((resp) => resp || fetch(e.request).then((netResp) => {
          cache.put(e.request, netResp.clone());
          return netResp;
        }))
      )
    );
  }
});
`
	w.Write([]byte(sw))
}

// HandleHealth provides system health and metrics
func (h *ConsumerHandler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	totalMalls, totalProducts, totalDeals, totalMerchants := h.store.GetTotalCounts()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status":    "healthy",
		"engine":    "pure-go",
		"version":   "1.23",
		"timestamp": time.Now().Format(time.RFC3339),
		"data": map[string]int{
			"malls":     totalMalls,
			"products":  totalProducts,
			"deals":     totalDeals,
			"merchants": totalMerchants,
		},
	})
}

// HandleAssistant processes Gemini AI assistant requests with tool execution
func (h *ConsumerHandler) HandleAssistant(w http.ResponseWriter, r *http.Request) {
	var message string
	if strings.Contains(r.Header.Get("Content-Type"), "application/json") {
		var body struct {
			Message string `json:"message"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		message = body.Message
	} else {
		_ = r.ParseForm()
		message = r.FormValue("message")
		if message == "" {
			message = r.FormValue("q")
		}
	}

	resp, err := h.aiSvc.Ask(r.Context(), message)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Render HTMX partial card if requested via HTMX
	if r.Header.Get("HX-Request") != "" {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprintf(w, `<div class="p-4 rounded-xl bg-slate-900 text-white shadow-lg space-y-3 mb-4 border border-slate-700">`)
		fmt.Fprintf(w, `<div class="flex items-center justify-between text-xs text-slate-400">`)
		fmt.Fprintf(w, `<span class="flex items-center gap-1.5 text-emerald-400 font-bold tracking-wide uppercase"><span>⚡</span> Gemini AI Assistant</span>`)
		fmt.Fprintf(w, `<span>%.1fms</span>`, resp.LatencyMs)
		fmt.Fprintf(w, `</div>`)
		fmt.Fprintf(w, `<div class="text-sm text-slate-200 leading-relaxed">%s</div>`, resp.Reply)
		if len(resp.Products) > 0 {
			fmt.Fprintf(w, `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">`)
			for _, p := range resp.Products {
				fmt.Fprintf(w, `<a href="/p/%s" class="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition flex items-center gap-3 text-left">`, p.ID)
				if p.ImageURL != "" {
					fmt.Fprintf(w, `<img src="%s" class="w-12 h-12 object-cover rounded" alt="" />`, p.ImageURL)
				}
				fmt.Fprintf(w, `<div class="min-w-0 flex-1"><div class="text-xs font-semibold text-white truncate">%s</div><div class="text-xs text-emerald-400 font-bold">R %.2f</div></div>`, p.Title, p.PriceZar)
				fmt.Fprintf(w, `</a>`)
			}
			fmt.Fprintf(w, `</div>`)
		}
		fmt.Fprintf(w, `</div>`)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

// HandleShorts redirects or renders the 9:16 Trade Shorts stream
func (h *ConsumerHandler) HandleShorts(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/?tab=shorts", http.StatusFound)
}

// HandleRequests redirects or renders the Wholesale Buyer RFQ desk
func (h *ConsumerHandler) HandleRequests(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/?tab=b2b", http.StatusFound)
}

// HandleChat renders the live commerce chat and negotiation desk
func (h *ConsumerHandler) HandleChat(w http.ResponseWriter, r *http.Request) {
	selectedMerchantID := r.URL.Query().Get("merchantId")
	if selectedMerchantID == "" {
		selectedMerchantID = "loc_mitrend_midrand"
	}

	merchants := []templates.ChatMerchantContact{
		{
			ID:          "loc_mitrend_midrand",
			Name:        "Mitrend Products (Pty) Ltd",
			Category:    "Hospitality & Commercial Catering",
			City:        "Midrand, Johannesburg",
			Avatar:      "M",
			Cipc:        "2018/489102/07",
			Verified:    true,
			Online:      true,
			LastMessage: "Yes absolutely! I have generated formal quotation #QUO-2026-0814 for 200 units.",
			Time:        "10:24",
		},
		{
			ID:          "loc_buildmax_centurion",
			Name:        "Buildmax Commercial Supplies",
			Category:    "Hardware & Construction Materials",
			City:        "Centurion, Pretoria",
			Avatar:      "B",
			Cipc:        "2019/331044/07",
			Verified:    true,
			Online:      true,
			LastMessage: "All silicone lids and hardware fittings are tested to SABS SANS standards.",
			Time:        "Yesterday",
		},
		{
			ID:          "loc_highveld_solar",
			Name:        "Highveld Solar & Energy Hub",
			Category:    "Renewables & Backup Power",
			City:        "Sandton, Johannesburg",
			Avatar:      "H",
			Cipc:        "2021/119042/07",
			Verified:    true,
			Online:      false,
			LastMessage: "Deye 5kW hybrid inverters in stock with 5-year SABS warranty.",
			Time:        "2 days ago",
		},
		{
			ID:          "loc_cape_solar_bellville",
			Name:        "Cape Solar & Commercial",
			Category:    "Wholesale Inverters & Batteries",
			City:        "Bellville, Cape Town",
			Avatar:      "C",
			Cipc:        "2020/554122/07",
			Verified:    true,
			Online:      true,
			LastMessage: "Deye 8kW and Dyness 5.12kWh lithium packs available for immediate freight dispatch.",
			Time:        "3 days ago",
		},
	}

	trends := h.store.GetTrends()
	guilds := h.store.GetGuilds()
	topDrops := h.store.GetTopDrops(5)

	data := templates.ChatViewData{
		Title:              "Direct Messages & Wholesale Negotiation Desk · Shoppage South Africa",
		Description:        "Commerce-native direct messaging with verified South African wholesalers, structured quotes and instant EFT rails.",
		CurrentTab:         "chat",
		SelectedMerchantID: selectedMerchantID,
		Merchants:          merchants,
		Trends:             trends,
		TopDrops:           topDrops,
		Guilds:             guilds,
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := templates.RenderChat(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// HandleOfferModal renders the interactive Bob Shop-style Make an Offer counter-negotiation modal
func (h *ConsumerHandler) HandleOfferModal(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	priceParam := r.URL.Query().Get("price")
	merchantParam := r.URL.Query().Get("merchant")

	product, ok := h.store.GetProductByID(id)
	if !ok {
		// Fallback product stub
		product = models.ProductDetail{
			CanonicalID:       id,
			Title:             "Special Commercial Item",
			Brand:             "Verified Wholesaler",
			Model:             "Trade Item",
			ImageURL:          "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=65",
			LowestOfferPrice:  1000.0,
			EstimatedPriceZar: 1000.0,
		}
	}

	targetPrice := product.LowestOfferPrice
	if priceParam != "" {
		if p, err := strconv.ParseFloat(priceParam, 64); err == nil && p > 0 {
			targetPrice = p
		}
	}

	var targetOffer models.MerchantOffer
	if len(product.Offers) > 0 {
		targetOffer = product.Offers[0]
		if merchantParam != "" {
			for _, o := range product.Offers {
				if o.MerchantID == merchantParam || strings.EqualFold(o.MerchantName, merchantParam) {
					targetOffer = o
					break
				}
			}
		}
	} else {
		targetOffer = models.MerchantOffer{
			MerchantID:   "loc_wholesaler",
			MerchantName: "Verified SA Trade Supplier",
			City:         "Johannesburg",
			PriceZar:     targetPrice,
			InStock:      true,
			Verified:     true,
			WhatsApp:     "27825551234",
		}
	}

	data := templates.OfferModalViewData{
		Product:     product,
		Merchant:    targetOffer,
		TargetPrice: targetPrice,
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := templates.RenderOfferModal(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// HandleSubmitOffer processes the counter-negotiation form and returns a confirmed WhatsApp handoff
func (h *ConsumerHandler) HandleSubmitOffer(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	productId := r.FormValue("productId")
	_ = productId
	productTitle := r.FormValue("productTitle")
	merchantName := r.FormValue("merchantName")
	merchantPhone := strings.TrimSpace(r.FormValue("merchantPhone"))
	if merchantPhone == "" {
		merchantPhone = "27825551234"
	}
	// Normalize phone for WhatsApp international link
	cleanPhone := strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, merchantPhone)
	if strings.HasPrefix(cleanPhone, "0") {
		cleanPhone = "27" + cleanPhone[1:]
	}

	listedPrice, _ := strconv.ParseFloat(r.FormValue("listedPrice"), 64)
	offerPrice, _ := strconv.ParseFloat(r.FormValue("offerPrice"), 64)
	qty, _ := strconv.Atoi(r.FormValue("quantity"))
	if qty <= 0 {
		qty = 1
	}

	buyerName := strings.TrimSpace(r.FormValue("buyerName"))
	buyerPhone := strings.TrimSpace(r.FormValue("buyerPhone"))
	notes := strings.TrimSpace(r.FormValue("notes"))
	fulfillment := r.FormValue("fulfillment")

	fulfillmentLabel := "Mall Collection (FREE)"
	if fulfillment == "pudo" {
		fulfillmentLabel = "Pudo Smart Locker (R60)"
	} else if fulfillment == "courier" {
		fulfillmentLabel = "Door Courier (R85)"
	}

	totalSavings := 0.0
	if listedPrice > offerPrice {
		totalSavings = (listedPrice - offerPrice) * float64(qty)
	}

	// Construct pre-filled WhatsApp text
	waMessage := fmt.Sprintf(
		"Sawubona %s! I'm submitting a counter-offer on Shoppage for:\n\n*Item:* %s\n*Offer Price:* R %.2f each (Listed: R %.2f)\n*Quantity:* %d unit(s)\n*Preferred Delivery:* %s\n*Buyer:* %s (%s)\n*Note:* %s\n\nPlease let me know if this is approved for collection/invoice.",
		merchantName,
		productTitle,
		offerPrice,
		listedPrice,
		qty,
		fulfillmentLabel,
		buyerName,
		buyerPhone,
		notes,
	)

	waURL := fmt.Sprintf("https://wa.me/%s?text=%s", cleanPhone, url.QueryEscape(waMessage))

	result := models.OfferSubmissionResult{
		OfferID:      fmt.Sprintf("off_%d", time.Now().UnixMilli()),
		Status:       "received",
		WhatsAppURL:  waURL,
		Message:      fmt.Sprintf("Your counter-offer of R %.2f each for %d unit(s) has been routed to %s. Click below to confirm directly on WhatsApp.", offerPrice, qty, merchantName),
		OfferPrice:   offerPrice,
		Quantity:     qty,
		TotalSavings: totalSavings,
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := templates.RenderOfferSuccessCard(w, result); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// HandleSitemapXML generates an automated XML sitemap for Google Search bots
func (h *ConsumerHandler) HandleSitemapXML(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	now := time.Now().Format("2006-01-02")

	fmt.Fprintf(w, `<?xml version="1.0" encoding="UTF-8"?>`+"\n")
	fmt.Fprintf(w, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`+"\n")

	// Core platform landing pages
	coreRoutes := []struct {
		path string
		prio string
	}{
		{"/", "1.0"},
		{"/search", "0.9"},
		{"/malls", "0.8"},
		{"/requests", "0.8"},
		{"/shorts", "0.7"},
		{"/chat", "0.7"},
	}

	for _, rt := range coreRoutes {
		fmt.Fprintf(w, `  <url>`+"\n")
		fmt.Fprintf(w, `    <loc>http://localhost:3000%s</loc>`+"\n", rt.path)
		fmt.Fprintf(w, `    <lastmod>%s</lastmod>`+"\n", now)
		fmt.Fprintf(w, `    <changefreq>daily</changefreq>`+"\n")
		fmt.Fprintf(w, `    <priority>%s</priority>`+"\n", rt.prio)
		fmt.Fprintf(w, `  </url>`+"\n")
	}

	// Products
	products := h.store.SearchProducts("", "", "", false)
	for _, p := range products {
		fmt.Fprintf(w, `  <url>`+"\n")
		fmt.Fprintf(w, `    <loc>http://localhost:3000/p/%s</loc>`+"\n", p.ID)
		fmt.Fprintf(w, `    <lastmod>%s</lastmod>`+"\n", now)
		fmt.Fprintf(w, `    <changefreq>daily</changefreq>`+"\n")
		fmt.Fprintf(w, `    <priority>0.9</priority>`+"\n")
		fmt.Fprintf(w, `  </url>`+"\n")
	}

	// Stores
	merchants := h.store.GetAllMerchants()
	for _, m := range merchants {
		fmt.Fprintf(w, `  <url>`+"\n")
		fmt.Fprintf(w, `    <loc>http://localhost:3000/m/%s</loc>`+"\n", m.ID)
		fmt.Fprintf(w, `    <lastmod>%s</lastmod>`+"\n", now)
		fmt.Fprintf(w, `    <changefreq>weekly</changefreq>`+"\n")
		fmt.Fprintf(w, `    <priority>0.8</priority>`+"\n")
		fmt.Fprintf(w, `  </url>`+"\n")
	}

	fmt.Fprintf(w, `</urlset>`+"\n")
}

// HandleRobotsTXT generates dynamic robots.txt pointing to the XML sitemap
func (h *ConsumerHandler) HandleRobotsTXT(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprintf(w, "User-agent: *\n")
	fmt.Fprintf(w, "Allow: /\n\n")
	fmt.Fprintf(w, "Sitemap: http://localhost:3000/sitemap.xml\n")
}

// HandleSearchSuggest returns instant autocomplete suggestions for search input
func (h *ConsumerHandler) HandleSearchSuggest(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	suggestions := h.store.GetSearchSuggestions(q)
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(suggestions)
}

// HandleStoreReviewSubmit processes interactive buyer review submissions (GMB Parity)
func (h *ConsumerHandler) HandleStoreReviewSubmit(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	storeID := r.FormValue("store_id")
	author := r.FormValue("author_name")
	company := r.FormValue("company")
	rating, _ := strconv.Atoi(r.FormValue("rating"))
	if rating <= 0 || rating > 5 {
		rating = 5
	}
	text := strings.TrimSpace(r.FormValue("review_text"))

	if author == "" {
		author = "Verified Trade Buyer"
	}
	if company == "" {
		company = "South African Commercial Client"
	}
	if text == "" {
		text = "Excellent supplier with dependable stock availability and prompt communication."
	}

	review := models.StoreTestimonial{
		ID:         fmt.Sprintf("t_%d", time.Now().UnixNano()%100000),
		AuthorName: author,
		Company:    company,
		Rating:     rating,
		Text:       text,
		DateStr:    "Just now",
		Verified:   true,
	}

	h.store.AddStoreTestimonial(storeID, review)

	// If HTMX request, return the rendered testimonial card snippet
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintf(w, `<div class="bg-white rounded-2xl border-2 border-emerald-500/60 p-5 shadow-xs relative overflow-hidden transition animate-fadeIn">
		<div class="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-bl-lg">
			✓ Just Posted
		</div>
		<div class="flex items-center gap-1 text-amber-500 text-sm mb-3">
			%s
		</div>
		<p class="text-xs text-slate-700 leading-relaxed italic mb-4">"%s"</p>
		<div class="border-t border-slate-100 pt-3 flex items-center justify-between">
			<div>
				<div class="font-bold text-xs text-slate-900">%s</div>
				<div class="text-[10px] text-slate-500">%s · Verified Buyer</div>
			</div>
			<span class="text-[10px] text-slate-400 font-mono">Just now</span>
		</div>
	</div>`, strings.Repeat("★", rating), text, author, company)
}

// HandleInstantCheckout simulates automated instant settlement (Amazon / Ozow Parity)
func (h *ConsumerHandler) HandleInstantCheckout(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	productTitle := r.FormValue("product_title")
	sku := r.FormValue("sku")
	qty, _ := strconv.Atoi(r.FormValue("quantity"))
	if qty <= 0 {
		qty = 1
	}
	unitPrice, _ := strconv.ParseFloat(r.FormValue("unit_price"), 64)
	if unitPrice <= 0 {
		unitPrice = 4500.00
	}
	buyerName := r.FormValue("buyer_name")
	if buyerName == "" {
		buyerName = "Sipho Dlamini"
	}
	paymentMethod := r.FormValue("payment_method")
	if paymentMethod == "" {
		paymentMethod = "Ozow Instant EFT"
	}

	subtotal := unitPrice * float64(qty)
	vat := subtotal * 0.15
	grandTotal := subtotal + vat
	orderNo := fmt.Sprintf("ORD-2026-%04d", time.Now().Unix()%10000)
	waybill := fmt.Sprintf("TCG-ZA-%06d", time.Now().UnixNano()%1000000)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintf(w, `<div class="bg-white rounded-3xl border border-emerald-500/80 p-6 shadow-xl max-w-lg mx-auto text-slate-900 text-left">
		<div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
			<div class="flex items-center gap-2">
				<div class="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-base">✓</div>
				<div>
					<h3 class="text-sm font-black text-slate-900">Payment Settled &amp; Order Confirmed</h3>
					<div class="text-[11px] text-slate-500">Method: <b class="text-emerald-700">%s</b></div>
				</div>
			</div>
			<span class="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">%s</span>
		</div>
		<div class="space-y-2 text-xs mb-5">
			<div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
				<div class="font-bold text-slate-900">%s</div>
				<div class="text-slate-500 text-[11px] mt-0.5">SKU: %s · Quantity: %d Unit(s) @ R %.2f</div>
			</div>
			<div class="flex justify-between text-slate-600 pt-1">
				<span>Subtotal (Excl. VAT):</span>
				<span class="font-bold">R %.2f ZAR</span>
			</div>
			<div class="flex justify-between text-slate-600">
				<span>SARS 15%% VAT:</span>
				<span class="font-bold text-emerald-700">R %.2f ZAR</span>
			</div>
			<div class="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
				<span>Total Paid:</span>
				<span class="text-emerald-700">R %.2f ZAR</span>
			</div>
		</div>
		<div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 mb-5">
			<div class="font-bold flex items-center gap-1.5">
				<span>🚚</span> <span>The Courier Guy Waybill Issued:</span>
			</div>
			<div class="font-mono font-bold text-emerald-800 mt-1">%s</div>
			<div class="text-[10.5px] text-emerald-700 mt-0.5">Dispatching from Midrand Central Hub, Bay 4 (24h Express).</div>
		</div>
		<div class="flex gap-2.5">
			<button type="button" onclick="window.print();" class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition">
				📄 Download Tax PDF
			</button>
			<button type="button" onclick="document.getElementById('instant-checkout-modal')?.close();" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition">
				Done
			</button>
		</div>
	</div>`, paymentMethod, orderNo, productTitle, sku, qty, unitPrice, subtotal, vat, grandTotal, waybill)
}

// HandleStoreEmbed renders an embeddable iframe widget of the merchant storefront
func (h *ConsumerHandler) HandleStoreEmbed(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	merchant, ok := h.store.GetMerchantByID(id)
	if !ok {
		http.NotFound(w, r)
		return
	}

	data := templates.EmbedStoreViewData{
		Store:   merchant,
		Catalog: merchant.Catalog,
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	// Allow embedding in iframes
	w.Header().Del("X-Frame-Options")
	w.Header().Set("Content-Security-Policy", "frame-ancestors *")
	if err := templates.RenderEmbedStore(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// HandleBadgeSVG generates official vector badges for external websites & email signatures
func (h *ConsumerHandler) HandleBadgeSVG(w http.ResponseWriter, r *http.Request) {
	badgeType := chi.URLParam(r, "type")
	w.Header().Set("Content-Type", "image/svg+xml")
	w.Header().Set("Cache-Control", "public, max-age=86400")

	switch badgeType {
	case "find-us-on-shoppage":
		svg := `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" width="200" height="50">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="bolt" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
  <rect width="200" height="50" rx="12" fill="url(#bg)"/>
  <rect x="12" y="10" width="30" height="30" rx="7" fill="#ffffff" fill-opacity="0.2"/>
  <path d="M22 20C22 17.79 23.79 16 26 16H28C30.21 16 32 17.79 32 20V22H22V20Z" fill="none" stroke="#ffffff" stroke-width="2"/>
  <rect x="18" y="21" width="18" height="15" rx="3" fill="#ffffff"/>
  <path d="M28 22L24 28H28L26 34L31 27H27.5L28 22Z" fill="url(#bolt)"/>
  <text x="52" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="700" fill="#A7F3D0" letter-spacing="1.2">FIND US ON</text>
  <text x="52" y="37" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14.5" font-weight="900" fill="#ffffff" letter-spacing="0.5">SHOPPAGE</text>
</svg>`
		w.Write([]byte(svg))

	case "order-on-shoppage":
		svg := `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 50" width="220" height="50">
  <defs>
    <linearGradient id="bolt" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>
  </defs>
  <rect width="220" height="50" rx="12" fill="#0F172A" stroke="#334155" stroke-width="1.5"/>
  <circle cx="26" cy="25" r="14" fill="#1E293B"/>
  <path d="M27 18L22 25H27L25 32L31 24H26.5L27 18Z" fill="url(#bolt)"/>
  <text x="50" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="700" fill="#34D399" letter-spacing="1.2">ORDER WHOLESALE ON</text>
  <text x="50" y="37" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" fill="#ffffff" letter-spacing="0.5">SHOPPAGE SOUTH AFRICA</text>
</svg>`
		w.Write([]byte(svg))

	case "verified-merchant":
		svg := `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 50" width="230" height="50">
  <rect width="230" height="50" rx="12" fill="#ffffff" stroke="#10B981" stroke-width="1.8"/>
  <rect x="10" y="10" width="30" height="30" rx="8" fill="#ECFDF5"/>
  <path d="M20 25L24 29L31 21" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="48" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="800" fill="#059669" letter-spacing="1">CIPC VERIFIED MERCHANT</text>
  <text x="48" y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#0F172A">SHOPPAGE TRADE DESK</text>
</svg>`
		w.Write([]byte(svg))

	default: // shoppage-icon
		svg := `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <defs>
    <linearGradient id="sp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="sp-bolt" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="12" fill="url(#sp-grad)"/>
  <path d="M14 18C14 15.79 15.79 14 18 14H30C32.21 14 34 15.79 34 18L35 34C35 36.21 33.21 38 31 38H17C14.79 38 13 36.21 13 34L14 18Z" fill="#FFFFFF"/>
  <path d="M19 15V12C19 9.79 20.79 8 23 8H25C27.21 8 29 9.79 29 12V15" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M26 18L19 26H25L23 34L30 25H25L26 18Z" fill="url(#sp-bolt)"/>
</svg>`
		w.Write([]byte(svg))
	}
}



