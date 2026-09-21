package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
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
		if !strings.Contains(body, "SHOPPAGE") {
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
		if !strings.Contains(body, "Matching Businesses &amp; Suppliers") && !strings.Contains(body, "Matching Businesses & Suppliers") {
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
		if !strings.Contains(body, "Matching Places &amp; Shopping Centres") && !strings.Contains(body, "Matching Places & Shopping Centres") {
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
		if !strings.Contains(body, "Verified Merchant Offers") {
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
		if !strings.Contains(body, "South African Malls") {
			t.Fatalf("expected South African Malls header")
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
		if !strings.Contains(body, "Retailer Specials") {
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
		if !strings.Contains(body, "CIPC Verified") {
			t.Fatalf("expected CIPC verified badge")
		}
		if !strings.Contains(body, "schema.org") || !strings.Contains(body, "WholesaleStore") {
			t.Fatalf("expected Schema.org WholesaleStore structured data")
		}
		if !strings.Contains(body, "Get Directions") && !strings.Contains(body, "google.com/maps") {
			t.Fatalf("expected Google Maps directions link")
		}
		if !strings.Contains(body, "Open Now") && !strings.Contains(body, "Closed Now") {
			t.Fatalf("expected live operating hours status chip")
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
		if !strings.Contains(body, "Where to Buy in South Africa") {
			t.Fatalf("expected BuyBox header in body")
		}
		if !strings.Contains(body, "WhatsApp Quote") {
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
		if !strings.Contains(body, "Change Commercial Area") {
			t.Fatalf("expected location modal title")
		}
		if !strings.Contains(body, "Gauteng") {
			t.Fatalf("expected Gauteng province button")
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
		if !strings.Contains(body, "Just Posted") {
			t.Errorf("expected Just Posted tag in rendered card")
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
		if !strings.Contains(body, "Payment Settled &amp; Order Confirmed") && !strings.Contains(body, "Payment Settled & Order Confirmed") {
			t.Errorf("expected order confirmed title")
		}
		if !strings.Contains(body, "Ozow Instant EFT") {
			t.Errorf("expected payment method in card")
		}
		if !strings.Contains(body, "SARS 15% VAT") {
			t.Errorf("expected SARS 15%% VAT line")
		}
		if !strings.Contains(body, "The Courier Guy Waybill Issued") {
			t.Errorf("expected courier waybill section")
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
		if !strings.Contains(body, "Quote") {
			t.Errorf("expected Quote button in embedded widget body")
		}
	})

	t.Run("HandleTrackOrder returns live courier tracking information", func(t *testing.T) {
		// Test existing seeded order
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
			if !m.Verified {
				t.Errorf("expected merchant to be verified")
			}
		}
	})

	t.Run("HandleBuyerProtection renders Trade Assurance escrow policy", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/buyer-protection", nil)
		rec := httptest.NewRecorder()
		h.HandleBuyerProtection(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		body := rec.Body.String()
		if !strings.Contains(body, "Buyer Protection") {
			t.Errorf("expected body to contain 'Buyer Protection'")
		}
		if !strings.Contains(body, "Trade Assurance") {
			t.Errorf("expected body to contain 'Trade Assurance'")
		}
		if !strings.Contains(body, "Escrow") {
			t.Errorf("expected body to contain 'Escrow'")
		}
	})
}



