package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/shoppage/merchant-os/internal/assets"
	"github.com/shoppage/merchant-os/internal/config"
	"github.com/shoppage/merchant-os/internal/fixtures"
	"github.com/shoppage/merchant-os/internal/handlers"
)

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
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001", "https://shoppage.co.za", "*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Core & Health
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

	// Dashboard & Tab Navigation (All 12 Modules)
	r.Get("/", h.ServeDashboard)
	r.Get("/desk", h.ServeDashboard)
	r.Get("/tab/{tab}", h.ServeTab)

	// Catalog & Product Operations
	r.Get("/catalog/export.csv", h.ExportCatalogCSV)
	r.Get("/catalog/new", h.ServeProductNew)
	r.Get("/catalog/{id}", h.ServeProductDetail)
	r.Get("/catalog/{id}/edit", h.ServeProductEdit)
	r.Post("/catalog/{id}/edit", h.SaveProductEdit)
	r.Post("/catalog/new", h.CreateProduct)
	r.Post("/catalog/{id}/toggle-stock", h.ToggleStock)
	r.Post("/catalog/{id}/price", h.UpdatePrice)

	// Inventory Operations
	r.Post("/inventory/{id}/adjust", h.AdjustInventory)
	r.Post("/inventory/intake", h.AdjustInventoryIntake)
	r.Get("/inventory/export.csv", h.ExportInventoryCSV)

	// Orders & B2B Proformas
	r.Get("/orders/{id}/invoice", h.ServeInvoiceModal)
	r.Post("/orders/{id}/advance-status", h.AdvanceOrderStatus)
	r.Post("/orders/new", h.CreateOrder)

	// Amazon-Style RMA Returns Management
	r.Post("/rma/update", h.UpdateRMAStatus)
	r.Post("/rma/new", h.CreateRMARequest)

	// RFQ Commercial Leads
	r.Post("/rfqs/{id}/convert", h.ConvertRFQ)

	// Customers & CRM
	r.Post("/customers/new", h.CreateCustomer)
	r.Get("/customers/export.csv", h.ExportCustomersCSV)

	// Discounts & Coupons
	r.Post("/discounts/{id}/toggle", h.ToggleCoupon)
	r.Post("/discounts/new", h.CreateCoupon)
	r.Post("/discounts/tier/new", h.CreateWholesaleTier)

	// Channels & WhatsApp Automation
	r.Post("/channels/sync", h.SyncChannels)
	r.Post("/channels/settings", h.SaveChannelSettings)

	// Direct Messages & Buyer Commerce Chat Desk
	r.Get("/chat/thread/{id}", h.SelectChatThread)
	r.Post("/chat/send", h.SendChatMessage)
	r.Post("/chat/quote", h.SendStructuredQuote)
	r.Post("/chat/action", h.HandleChatAction)

	// Pemofy AI Copilot Studio
	r.Post("/copilot/ask", h.AskCopilot)
	r.Post("/copilot/action", h.ExecuteCopilotAction)

	// Store Settings & Banking
	r.Post("/settings/save", h.SaveSettings)
	r.Post("/settings/banking", h.SaveBanking)
	r.Post("/settings/plan", h.UpdatePlan)

	// Inter-Hub Transfers & Logistics
	r.Post("/transfers/new", h.CreateTransfer)
	r.Post("/transfers/{id}/receive", h.ReceiveTransfer)

	// Carrier Manifests
	r.Post("/manifests/new", h.GenerateManifest)

	// Point of Sale Register
	r.Post("/pos/checkout", h.POSCheckout)

	// Barcode Scanner & Cycle Audits
	r.Post("/scan/reconcile", h.ReconcileScan)

	// Flow Automations
	r.Post("/flow/{id}/toggle", h.ToggleFlowRule)
	r.Post("/flow/new", h.CreateFlowRule)

	// Media & Compliance Assets
	r.Post("/media/new", h.CreateMediaAsset)

	// Storefront Theme Studio
	r.Post("/editor/save", h.SaveEditorSettings)

	// Audit Logs CSV Export
	r.Get("/audit-logs/export.csv", h.ExportAuditLogsCSV)

	// Syndication Feeds
	r.Get("/feeds/google-merchant-center.xml", h.ServeGMCFeed)
	r.Get("/feeds/meta-catalog.csv", h.ServeMetaCatalogCSV)
	r.Post("/feeds/validate", h.ValidateFeeds)

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
