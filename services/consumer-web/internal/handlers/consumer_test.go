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
}

