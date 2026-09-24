package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/shoppage/merchant-os/internal/assets"
	"github.com/shoppage/merchant-os/internal/auth"
	"github.com/shoppage/merchant-os/internal/config"
	"github.com/shoppage/merchant-os/internal/fixtures"
	"github.com/shoppage/merchant-os/internal/handlers"
)

// allowedOrigins reads ALLOWED_ORIGINS (comma-separated) and fails closed to
// localhost-only in development; never returns "*".
func allowedOrigins() []string {
	if v := os.Getenv("ALLOWED_ORIGINS"); v != "" {
		var out []string
		for _, s := range strings.Split(v, ",") {
			s = strings.TrimSpace(s)
			if s != "" && s != "*" {
				out = append(out, s)
			}
		}
		if len(out) > 0 {
			return out
		}
	}
	return []string{"http://localhost:3000", "http://localhost:3001"}
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	port := os.Getenv("MERCHANT_PORT")
	if port == "" {
		port = os.Getenv("PORT")
		if port == "" || port == "3000" || port == "80" {
			port = "8083"
		}
	}

	cfg := config.Load()
	state := handlers.NewStateWithProfile(fixtures.DemoStoreProfile(cfg))
	h := handlers.NewHandlerWithConfig(state, cfg)

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins(),
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Core & Health (public)
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"healthy","service":"shoppage-merchant-os","port":%s}`+"\n", port)
	})
	r.Get("/favicon.ico", h.ServeFavicon)
	r.Get("/favicon.svg", h.ServeFavicon)
	r.Get("/media/files/{id}", h.ServeMediaFile)

	// Embedded assets (HTMX) served locally: the merchant workspace must not depend
	// on a public CDN, so it keeps working on slow, filtered or offline store networks.
	r.Handle("/static/*", http.StripPrefix("/static", assets.Handler()))

	// Authentication: login page + session endpoints are public; everything else
	// under the merchant workspace requires a valid SHOPPAGE_AUTH_SECRET session.
	// Development bootstraps a local secret + demo admin when unset; production
	// still fails closed until real SHOPPAGE_AUTH_SECRET / SHOPPAGE_ADMIN_* are set.
	if auth.EnsureLocalAuth() {
		slog.Info("Bootstrapped local Merchant OS auth secret (development only)")
	}
	authSecret := os.Getenv("SHOPPAGE_AUTH_SECRET")
	r.Get("/login", h.ServeLogin)
	r.Post("/auth/login", h.Login)
	r.Post("/auth/logout", h.Logout)

	protected := chi.NewRouter()
	protected.Use(auth.RequireSession(authSecret))
	protected.Get("/", h.ServeDashboard)
	protected.Get("/desk", h.ServeDashboard)
	protected.Get("/tab/{tab}", h.ServeTab)

	// Catalog & Product Operations
	protected.Get("/catalog/export.csv", h.ExportCatalogCSV)
	protected.Get("/catalog/new", h.ServeProductNew)
	protected.Get("/catalog/{id}", h.ServeProductDetail)
	protected.Get("/catalog/{id}/edit", h.ServeProductEdit)
	protected.Post("/catalog/{id}/edit", h.SaveProductEdit)
	protected.Post("/catalog/new", h.CreateProduct)
	protected.Post("/catalog/{id}/toggle-stock", h.ToggleStock)
	protected.Post("/catalog/{id}/price", h.UpdatePrice)

	// Inventory Operations
	protected.Post("/inventory/{id}/adjust", h.AdjustInventory)
	protected.Post("/inventory/intake", h.AdjustInventoryIntake)
	protected.Get("/inventory/export.csv", h.ExportInventoryCSV)

	// Orders & B2B Proformas
	protected.Get("/orders/{id}/invoice", h.ServeInvoiceModal)
	protected.Post("/orders/{id}/advance-status", h.AdvanceOrderStatus)
	protected.Post("/orders/new", h.CreateOrder)

	// Amazon-Style RMA Returns Management
	protected.Post("/rma/update", h.UpdateRMAStatus)
	protected.Post("/rma/new", h.CreateRMARequest)

	// RFQ Commercial Leads
	protected.Post("/rfqs/{id}/convert", h.ConvertRFQ)

	// Customers & CRM
	protected.Post("/customers/new", h.CreateCustomer)
	protected.Get("/customers/export.csv", h.ExportCustomersCSV)

	// Discounts & Coupons
	protected.Post("/discounts/{id}/toggle", h.ToggleCoupon)
	protected.Post("/discounts/new", h.CreateCoupon)
	protected.Post("/discounts/tier/new", h.CreateWholesaleTier)

	// Channels & WhatsApp Automation
	protected.Post("/channels/sync", h.SyncChannels)
	protected.Post("/channels/settings", h.SaveChannelSettings)

	// Direct Messages & Buyer Commerce Chat Desk
	protected.Get("/chat/thread/{id}", h.SelectChatThread)
	protected.Post("/chat/send", h.SendChatMessage)
	protected.Post("/chat/quote", h.SendStructuredQuote)
	protected.Post("/chat/action", h.HandleChatAction)

	// Pemofy AI Copilot Studio
	protected.Post("/copilot/ask", h.AskCopilot)
	protected.Post("/copilot/action", h.ExecuteCopilotAction)

	// Store Settings & Banking
	protected.Post("/settings/save", h.SaveSettings)
	protected.Post("/settings/banking", h.SaveBanking)
	protected.Post("/settings/plan", h.UpdatePlan)

	// Inter-Hub Transfers & Logistics
	protected.Post("/transfers/new", h.CreateTransfer)
	protected.Post("/transfers/{id}/receive", h.ReceiveTransfer)

	// Carrier Manifests
	protected.Post("/manifests/new", h.GenerateManifest)

	// Point of Sale Register
	protected.Post("/pos/checkout", h.POSCheckout)

	// Barcode Scanner & Cycle Audits
	protected.Post("/scan/reconcile", h.ReconcileScan)

	// Flow Automations
	protected.Post("/flow/{id}/toggle", h.ToggleFlowRule)
	protected.Post("/flow/new", h.CreateFlowRule)

	// Media & Compliance Assets
	protected.Post("/media/new", h.CreateMediaAsset)

	// Storefront Theme Studio
	protected.Post("/editor/save", h.SaveEditorSettings)

	// Audit Logs CSV Export
	protected.Get("/audit-logs/export.csv", h.ExportAuditLogsCSV)

	// Syndication Feeds (GMC/Meta links must be publicly fetchable by crawlers)
	protected.Get("/feeds/google-merchant-center.xml", h.ServeGMCFeed)
	protected.Get("/feeds/meta-catalog.csv", h.ServeMetaCatalogCSV)
	protected.Post("/feeds/validate", h.ValidateFeeds)

	r.Mount("/", protected)

	serverAddr := fmt.Sprintf(":%s", port)
	srv := &http.Server{
		Addr:         serverAddr,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	serverErrors := make(chan error, 1)
	go func() {
		slog.Info("Starting Shoppage Merchant OS Daemon", "port", port, "address", serverAddr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrors <- err
		}
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		slog.Error("Merchant OS encountered error", "err", err)
		os.Exit(1)
	case sig := <-shutdown:
		slog.Info("Stopping Merchant OS gracefully", "signal", sig.String())
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = srv.Shutdown(ctx)
	}
}
