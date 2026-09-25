package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/shoppage/consumer-web/internal/models"
	"github.com/shoppage/consumer-web/internal/store"
)

func TestConsumerHandlers(t *testing.T) {
	st := store.NewStore()
	h := NewConsumerHandler(st)

	t.Run("HandleHome returns valid HTML with South Africa title", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		rec := httptest.NewRecorder()

		h.HandleHome(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "Shoppage") {
			t.Fatalf("expected body to contain SHOPPAGE")
		}
		if !strings.Contains(body, "South Africa") {
			t.Fatalf("expected body to contain South Africa")
		}
	})

	t.Run("HandleSearch returns full page without HX-Request", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/search?q=inverter", nil)
		rec := httptest.NewRecorder()

		h.HandleSearch(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(strings.ToLower(body), "<!doctype html>") {
			t.Fatalf("expected full HTML document")
		}
		if !strings.Contains(body, "id=\"results-grid\"") {
			t.Fatalf("expected results-grid container")
		}
	})

	t.Run("HandleSearch returns partial grid with HX-Request", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/search?q=Sunsynk", nil)
		req.Header.Set("HX-Request", "true")
		rec := httptest.NewRecorder()

		h.HandleSearch(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if strings.Contains(body, "<!DOCTYPE html>") {
			t.Fatalf("expected partial HTML, not full document")
		}
		if !strings.Contains(body, "Sunsynk") {
			t.Fatalf("expected search result to contain Sunsynk")
		}
	})

	t.Run("HandleHome does not show prominent wholesalers or malls shelf", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		rec := httptest.NewRecorder()

		h.HandleHome(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if strings.Contains(body, "Featured Verified Wholesalers") {
			t.Fatalf("did not expect static 'Featured Verified Wholesalers' shelf on homepage")
		}
	})

	t.Run("HandleSearch omnisearch finds matching merchants when searching business", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/search?q=Mitrend", nil)
		req.Header.Set("HX-Request", "true")
		rec := httptest.NewRecorder()

		h.HandleSearch(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "Stores and markets") {
			t.Fatalf("expected Matching Businesses section in search results")
		}
		if !strings.Contains(body, "MiTrend") {
			t.Fatalf("expected MiTrend in search results")
		}
	})

	t.Run("HandleSearch omnisearch finds matching malls when searching places", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/search?q=Africa", nil)
		req.Header.Set("HX-Request", "true")
		rec := httptest.NewRecorder()

		h.HandleSearch(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "Stores and markets") {
			t.Fatalf("expected Matching Places section in search results")
		}
		if !strings.Contains(body, "Mall of Africa") {
			t.Fatalf("expected Mall of Africa in search results")
		}
	})

	t.Run("HandleProduct returns BuyBox for valid product", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/p/p_sunsynk_5k", nil)
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "p_sunsynk_5k")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
		rec := httptest.NewRecorder()

		h.HandleProduct(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "Sunsynk 5kW Hybrid Inverter") {
			t.Fatalf("expected product title in body")
		}
		if !strings.Contains(body, "Compare prices") {
			t.Fatalf("expected BuyBox offers header")
		}
	})

	t.Run("HandleMalls returns nationwide shopping centres", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/malls", nil)
		rec := httptest.NewRecorder()

		h.HandleMalls(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "Markets") {
			t.Fatalf("expected Markets header")
		}
		if !strings.Contains(body, "Mall of Africa") {
			t.Fatalf("expected Mall of Africa to be listed")
		}
	})

	t.Run("HandleSearch returns retailer specials for deals tab", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/search?tab=deals", nil)
		rec := httptest.NewRecorder()

		h.HandleSearch(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, `aria-current="page">Deals`) {
			t.Fatalf("expected Retailer Specials in body")
		}
	})

	t.Run("HandleStorefront returns public merchant profile", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/m/loc_sunpower_crownmines", nil)
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "loc_sunpower_crownmines")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
		rec := httptest.NewRecorder()

		h.HandleStorefront(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "SunPower Crown Mines Wholesale") {
			t.Fatalf("expected merchant title")
		}
		if strings.Contains(body, "CIPC Verified") {
			t.Fatalf("CIPC Verified badge must not appear on storefront")
		}
		if !strings.Contains(body, "schema.org") || !strings.Contains(body, "WholesaleStore") {
			t.Fatalf("expected Schema.org WholesaleStore structured data")
		}
		if !strings.Contains(body, "Get Directions") && !strings.Contains(body, "google.com/maps") {
			t.Fatalf("expected Google Maps directions link")
		}
		// This store has no trading hours on record, so no open/closed
		// status may be shown (enrichStorefront never guesses one).
		if strings.Contains(body, "Open now") || strings.Contains(body, "Closed now") {
			t.Fatalf("store without hours must not show an open/closed status")
		}
	})

	t.Run("HandleBuyBoxDrawer returns slide-out drawer partial", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/buybox/p_sunsynk_5k", nil)
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "p_sunsynk_5k")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
		rec := httptest.NewRecorder()

		h.HandleBuyBoxDrawer(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "Where to buy") {
			t.Fatalf("expected BuyBox header in body")
		}
		if !strings.Contains(body, "Contact") {
			t.Fatalf("expected WhatsApp Quote button in drawer")
		}
	})

	t.Run("HandleBroadcastPost prepends trade broadcast", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/feed/post", strings.NewReader("text=Looking+for+100x+pallets+of+PPC+Cement+in+Gauteng&pollOpt1=Immediate+Collection&pollOpt2=Site+Delivery"))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		rec := httptest.NewRecorder()

		h.HandleBroadcastPost(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "Looking for 100x pallets of PPC Cement") {
			t.Fatalf("expected post text in returned card")
		}
		if !strings.Contains(body, "LIVE TRADE") {
			t.Fatalf("expected LIVE TRADE badge")
		}
	})

	t.Run("HandleLocationModal returns province selector", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/location-modal", nil)
		rec := httptest.NewRecorder()

		h.HandleLocationModal(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "Your Trading Location") {
			t.Fatalf("expected location modal title")
		}
		if !strings.Contains(body, "Gauteng") {
			t.Fatalf("expected Gauteng province button")
		}
		if !strings.Contains(body, "Use my current location") {
			t.Fatalf("expected browser geolocation primary action")
		}
	})

	t.Run("HandleHealth returns status healthy", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/health", nil)
		rec := httptest.NewRecorder()

		h.HandleHealth(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		if !strings.Contains(rec.Body.String(), "healthy") {
			t.Fatalf("expected healthy status")
		}
	})

	t.Run("HandleSitemapXML generates valid XML sitemap with product and storefront URLs", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/sitemap.xml", nil)
		req.Host = "localhost:3000" // RequestBaseURL derives from the request host when SHOPPAGE_PUBLIC_URL is unset
		rec := httptest.NewRecorder()

		h.HandleSitemapXML(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		if !strings.Contains(rec.Header().Get("Content-Type"), "xml") {
			t.Errorf("expected XML content-type, got %s", rec.Header().Get("Content-Type"))
		}
		body := rec.Body.String()
		if !strings.Contains(body, `<?xml version="1.0" encoding="UTF-8"?>`) {
			t.Errorf("expected XML declaration")
		}
		if !strings.Contains(body, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`) {
			t.Errorf("expected sitemaps schema urlset")
		}
		if !strings.Contains(body, `<loc>http://localhost:3000/</loc>`) {
			t.Errorf("expected root url in sitemap")
		}
		if !strings.Contains(body, `<loc>http://localhost:3000/search</loc>`) {
			t.Errorf("expected search url in sitemap")
		}
		if !strings.Contains(body, `<loc>http://localhost:3000/m/`) {
			t.Errorf("expected merchant storefront urls in sitemap")
		}
	})

	t.Run("HandleRobotsTXT points to XML sitemap", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/robots.txt", nil)
		req.Host = "localhost:3000" // RequestBaseURL derives from the request host when SHOPPAGE_PUBLIC_URL is unset
		rec := httptest.NewRecorder()

		h.HandleRobotsTXT(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "User-agent: *") {
			t.Errorf("expected User-agent: * in robots.txt")
		}
		if !strings.Contains(body, "Sitemap: http://localhost:3000/sitemap.xml") {
			t.Errorf("expected Sitemap reference in robots.txt")
		}
	})

	t.Run("HandleSearchSuggest returns JSON autocomplete suggestions", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/search/suggest?q=inverter", nil)
		rec := httptest.NewRecorder()

		h.HandleSearchSuggest(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		if !strings.Contains(rec.Header().Get("Content-Type"), "application/json") {
			t.Errorf("expected application/json content-type")
		}
		body := rec.Body.String()
		if !strings.Contains(strings.ToLower(body), "inverter") && !strings.Contains(strings.ToLower(body), "sunsynk") {
			t.Errorf("expected suggestion query matches in json output, got: %s", body)
		}
	})

	t.Run("HandleStoreReviewSubmit saves testimonial and returns live card", func(t *testing.T) {
		form := "store_id=loc_mitrend_midrand&author_name=Thebe+Hospitality&company=Thebe+Group&rating=5&review_text=Consistent+wholesale+supply+and+fast+courier+dispatch."
		req := httptest.NewRequest("POST", "/store/review", strings.NewReader(form))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		req.Header.Set("HX-Request", "true")
		rec := httptest.NewRecorder()

		h.HandleStoreReviewSubmit(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "Just posted") {
			t.Errorf("expected Just posted tag in rendered card")
		}
		if !strings.Contains(body, "Thebe Hospitality") {
			t.Errorf("expected author name in review card")
		}
		if !strings.Contains(body, "Consistent wholesale supply") {
			t.Errorf("expected review text in rendered card")
		}
	})

	t.Run("HandleInstantCheckout settles payment with 15% VAT and courier waybill", func(t *testing.T) {
		form := "product_title=Sunsynk+5kW+Hybrid+Inverter&sku=SUN-5K&quantity=2&unit_price=14500.00&buyer_name=Sipho+Dlamini&payment_method=Ozow+Instant+EFT"
		req := httptest.NewRequest("POST", "/checkout/instant", strings.NewReader(form))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		req.Header.Set("HX-Request", "true")
		rec := httptest.NewRecorder()

		h.HandleInstantCheckout(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "Demo order created") || !strings.Contains(body, "no payment processed") {
			t.Errorf("expected demo checkout title that does not claim payment settled")
		}
		if !strings.Contains(body, "Ozow Instant EFT") {
			t.Errorf("expected payment method in card")
		}
		if !strings.Contains(body, "SARS 15% VAT") {
			t.Errorf("expected SARS 15%% VAT line")
		}
		if !strings.Contains(body, "no payment or courier integration") {
			t.Errorf("expected demo environment disclosure")
		}
	})

	t.Run("HandleBadgeSVG serves high-DPI vector badges", func(t *testing.T) {
		badgeTypes := []string{
			"find-us-on-shoppage",
			"order-on-shoppage",
			"verified-merchant",
			"shoppage-icon",
		}

		for _, bType := range badgeTypes {
			req := httptest.NewRequest("GET", "/badges/"+bType+".svg", nil)
			rctx := chi.NewRouteContext()
			rctx.URLParams.Add("type", bType)
			req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
			rec := httptest.NewRecorder()

			h.HandleBadgeSVG(rec, req)

			if rec.Code != http.StatusOK {
				t.Errorf("badge %s expected 200, got %d", bType, rec.Code)
			}
			contentType := rec.Header().Get("Content-Type")
			if contentType != "image/svg+xml" {
				t.Errorf("badge %s expected Content-Type image/svg+xml, got %s", bType, contentType)
			}
			body := rec.Body.String()
			if !strings.Contains(body, "<svg") || !strings.Contains(body, "</svg>") {
				t.Errorf("badge %s expected valid SVG XML markup", bType)
			}
		}
	})

	t.Run("HandleStoreEmbed serves embeddable widget with permissive CSP for external merchant sites", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/embed/m/loc_mitrend_midrand", nil)
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "loc_mitrend_midrand")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
		rec := httptest.NewRecorder()

		h.HandleStoreEmbed(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		csp := rec.Header().Get("Content-Security-Policy")
		if !strings.Contains(csp, "frame-ancestors *") {
			t.Errorf("expected frame-ancestors * in CSP header, got: %s", csp)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "MiTrend") {
			t.Errorf("expected store name in embedded widget body")
		}
		// Catalog is empty for this fixture, so the widget must show the
		// honest empty state rather than fabricated product cards.
		if !strings.Contains(body, "No published trade listings yet") {
			t.Errorf("expected empty-catalog state in embedded widget body")
		}
		if !strings.Contains(body, "Open Full Desk") {
			t.Errorf("expected Open Full Desk CTA in embedded widget body")
		}
	})

	t.Run("HandleTrackOrder returns live courier tracking information", func(t *testing.T) {
		// Remediation removed seedInitialOrders — tracking is fed only by
		// orders created through the checkout flow (or explicit test setup).
		st.CreateOrder(models.PlacedOrder{
			OrderNumber:    "ORD-2026-1042",
			BuyerName:      "Test Buyer",
			ProductTitle:   "Sunsynk 5kW Hybrid Inverter",
			SKU:            "SUN-5K",
			Quantity:       1,
			UnitPriceZar:   14500,
			SubtotalZar:    14500,
			VatZar:         2175,
			GrandTotal:     16675,
			Status:         "In Transit",
			Waybill:        "TCG-ZA-849201",
			DeliveryMethod: "The Courier Guy",
			PaymentMethod:  "Ozow Instant EFT",
			DateStr:        "22 Sep 10:00",
			EstimatedEta:   "24 Sep",
			MerchantName:   "SunPower Crown Mines Wholesale",
		})
		st.CreateOrder(models.PlacedOrder{
			OrderNumber:    "ORD-2026-0988",
			BuyerName:      "Test Buyer 2",
			ProductTitle:   "PPC Cement 42.5N",
			SKU:            "PPC-425",
			Quantity:       10,
			UnitPriceZar:   95,
			SubtotalZar:    950,
			VatZar:         142.5,
			GrandTotal:     1092.5,
			Status:         "Delivered",
			Waybill:        "PUDO-ZA-392180",
			DeliveryMethod: "Pudo Smart Locker",
			PaymentMethod:  "EFT",
			DateStr:        "20 Sep 09:00",
			EstimatedEta:   "Delivered",
			MerchantName:   "Mitrend Products",
		})

		// Test existing order
		req := httptest.NewRequest("GET", "/track?q=ORD-2026-1042", nil)
		rec := httptest.NewRecorder()
		h.HandleTrackOrder(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "ORD-2026-1042") {
			t.Errorf("expected body to contain order number ORD-2026-1042")
		}
		if !strings.Contains(body, "TCG-ZA-849201") {
			t.Errorf("expected body to contain Courier Guy waybill TCG-ZA-849201")
		}
		if !strings.Contains(body, "In Transit") {
			t.Errorf("expected body to contain order status In Transit")
		}

		// Test tracking by waybill
		reqWaybill := httptest.NewRequest("GET", "/track?q=PUDO-ZA-392180", nil)
		recWaybill := httptest.NewRecorder()
		h.HandleTrackOrder(recWaybill, reqWaybill)

		if recWaybill.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", recWaybill.Code)
		}
		bodyWaybill := recWaybill.Body.String()
		if !strings.Contains(bodyWaybill, "ORD-2026-0988") {
			t.Errorf("expected body to find order ORD-2026-0988 by waybill")
		}
		if !strings.Contains(bodyWaybill, "Delivered") {
			t.Errorf("expected body to contain Delivered status")
		}

		// Test non-existent order
		reqMissing := httptest.NewRequest("GET", "/track?q=ORD-UNKNOWN-9999", nil)
		recMissing := httptest.NewRecorder()
		h.HandleTrackOrder(recMissing, reqMissing)

		if recMissing.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", recMissing.Code)
		}
		bodyMissing := recMissing.Body.String()
		if !strings.Contains(bodyMissing, "No order found for") {
			t.Errorf("expected 'No order found for' message, got: %s", bodyMissing)
		}
	})

	t.Run("HandleSell renders supplier onboarding page with CIPC verification requirements", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/sell", nil)
		rec := httptest.NewRecorder()
		h.HandleSell(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "Sell on Shoppage") {
			t.Errorf("expected body to contain 'Sell on Shoppage'")
		}
		if !strings.Contains(body, "CIPC Registration #") {
			t.Errorf("expected body to contain 'CIPC Registration #' input field")
		}
	})

	t.Run("HandleSellRegister validates and provisions verified merchant storefront", func(t *testing.T) {
		// Test validation failure when fields are missing
		reqFail := httptest.NewRequest("POST", "/sell/register", strings.NewReader("name=&cipc="))
		reqFail.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		recFail := httptest.NewRecorder()
		h.HandleSellRegister(recFail, reqFail)

		if recFail.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", recFail.Code)
		}
		if !strings.Contains(recFail.Body.String(), "Please provide both your legal Company Name and CIPC Registration Number") {
			t.Errorf("expected validation error message")
		}

		// Test successful registration
		form := "name=Apex+Solar+Holdings+(Pty)+Ltd&cipc=2024/998877/07&category=Solar&address=10+Main+Rd&metro=Johannesburg&phone=0821234567&email=info@apex.co.za&bank=Standard+Bank"
		reqSuccess := httptest.NewRequest("POST", "/sell/register", strings.NewReader(form))
		reqSuccess.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		recSuccess := httptest.NewRecorder()
		h.HandleSellRegister(recSuccess, reqSuccess)

		if recSuccess.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", recSuccess.Code)
		}
		bodySuccess := recSuccess.Body.String()
		if !strings.Contains(bodySuccess, "Merchant Registration Approved") {
			t.Errorf("expected success confirmation in body")
		}

		// Verify merchant is accessible in store
		m, ok := st.GetMerchantByID("apex-solar-holdings")
		if !ok {
			t.Errorf("expected newly registered merchant 'apex-solar-holdings' to exist in store")
		} else {
			if m.CIPCNumber != "2024/998877/07" {
				t.Errorf("expected CIPC number to match, got %s", m.CIPCNumber)
			}
			// Registration must NOT auto-issue a verified stamp — vetting
			// grants trust marks, not the signup form.
			if m.Verified {
				t.Errorf("expected newly registered merchant to be unverified pending vetting")
			}
		}
	})

	t.Run("HandleEnterpriseVetting renders CIPC, SARS and depot compliance standards", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/enterprise-vetting", nil)
		rec := httptest.NewRecorder()
		h.HandleEnterpriseVetting(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "Enterprise Vetting") {
			t.Errorf("expected body to contain 'Enterprise Vetting'")
		}
		if !strings.Contains(body, "CIPC") {
			t.Errorf("expected body to contain 'CIPC'")
		}
		if !strings.Contains(body, "SARS Tax PIN") {
			t.Errorf("expected body to contain 'SARS Tax PIN'")
		}
		if !strings.Contains(body, "Physical Depot") {
			t.Errorf("expected body to contain 'Physical Depot'")
		}

		// Test backward compatible redirect from /buyer-protection
		reqLegacy := httptest.NewRequest("GET", "/buyer-protection", nil)
		recLegacy := httptest.NewRecorder()
		h.HandleBuyerProtection(recLegacy, reqLegacy)

		if recLegacy.Code != http.StatusMovedPermanently {
			t.Fatalf("expected 301 redirect, got %d", recLegacy.Code)
		}
		loc := recLegacy.Header().Get("Location")
		if loc != "/enterprise-vetting" {
			t.Errorf("expected Location /enterprise-vetting, got: %s", loc)
		}
	})
}

func TestAssistantCardEscapesReply(t *testing.T) {
	t.Setenv("GEMINI_API_KEY", "")
	h := NewConsumerHandler(store.NewStore())
	form := url.Values{"message": {`<img src=x onerror=alert(1)>`}}
	req := httptest.NewRequest(http.MethodPost, "/api/assistant", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("HX-Request", "true")
	rec := httptest.NewRecorder()
	h.HandleAssistant(rec, req)
	if strings.Contains(rec.Body.String(), "<img src=x onerror") {
		t.Fatal("assistant card reflects unescaped user input")
	}
}
