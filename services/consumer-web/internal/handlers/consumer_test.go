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
}

