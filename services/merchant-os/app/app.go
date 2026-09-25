// Package app assembles the Merchant OS HTTP application so it can run either
// as its own process (cmd/server) or mounted in-process by the consumer-web
// gateway, which is the default single-binary deployment.
package app

import (
	"bytes"
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/shoppage/merchant-os/internal/assets"
	"github.com/shoppage/merchant-os/internal/auth"
	"github.com/shoppage/merchant-os/internal/config"
	"github.com/shoppage/merchant-os/internal/fixtures"
	"github.com/shoppage/merchant-os/internal/handlers"
	"github.com/shoppage/platform/env"
	"github.com/shoppage/platform/web"
)

// WorkspaceStore persists workspace state per tenant (implemented by
// platform/db.Workspaces).
type WorkspaceStore interface {
	Load(ctx context.Context, tenant string) ([]byte, bool, error)
	Save(ctx context.Context, tenant string, state []byte) error
}

// Options configures the application.
type Options struct {
	// Workspaces, when set, makes every successful write durable before the
	// response is sent. Nil keeps state in memory (development only).
	Workspaces WorkspaceStore
	// Standalone adds the edge middleware (client IP, logging, metrics,
	// security headers, CSRF) that the gateway otherwise provides.
	Standalone bool
}

// New builds the Merchant OS handler.
func New(ctx context.Context, opts Options) (http.Handler, error) {
	cfg := config.Load()
	state := handlers.NewStateWithProfile(fixtures.DemoStoreProfile(cfg))
	if opts.Workspaces != nil {
		tenant := state.TenantID()
		stored, found, err := opts.Workspaces.Load(ctx, tenant)
		if err != nil {
			return nil, err
		}
		if found {
			if err := state.RestoreSnapshot(stored); err != nil {
				return nil, err
			}
			slog.Info("restored merchant workspace", "tenant", tenant)
		} else {
			snap, err := state.MarshalSnapshot()
			if err != nil {
				return nil, err
			}
			if err := opts.Workspaces.Save(ctx, tenant, snap); err != nil {
				return nil, err
			}
			slog.Info("seeded merchant workspace", "tenant", tenant)
		}
	}
	h := handlers.NewHandlerWithConfig(state, cfg)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	if opts.Standalone {
		r.Use(web.ClientIP(web.TrustedProxiesFromEnv()))
		r.Use(web.Observe("merchant-os"))
		r.Use(web.SecurityHeaders(web.DefaultCSP))
		cop, err := web.CrossOriginProtection(env.AllowedOrigins())
		if err != nil {
			return nil, err
		}
		r.Use(cop)
	}
	r.Use(web.Recover)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   env.AllowedOrigins(),
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Core & Health (public)
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"status":"healthy","service":"shoppage-merchant-os"}`)
	})
	r.Get("/favicon.ico", h.ServeFavicon)
	r.Get("/favicon.svg", h.ServeFavicon)
	r.Get("/media/files/{id}", h.ServeMediaFile)

	// Embedded assets (HTMX) served locally: the merchant workspace must not depend
	// on a public CDN, so it keeps working on slow, filtered or offline store networks.
	// Served under /merchant-static (not /static) so the paths are unique when
	// the workspace is mounted inside the consumer gateway.
	r.Handle("/merchant-static/*", http.StripPrefix("/merchant-static", assets.Handler()))
	r.Handle("/static/*", http.StripPrefix("/static", assets.Handler()))
	r.Get("/merchant-sw.js", assets.ServiceWorker)

	// Authentication: login page + session endpoints are public; everything else
	// under the merchant workspace requires a valid SHOPPAGE_AUTH_SECRET session.
	// Missing SHOPPAGE_AUTH_SECRET / SHOPPAGE_ADMIN_* are bootstrapped at startup
	// (operator-provided values always win) so an unconfigured instance boots
	// instead of refusing to start, matching pre-hardening behaviour.
	if auth.EnsureLocalAuth() {
		slog.Info("Bootstrapped local Merchant OS auth secret (development only)")
	}
	authSecret := os.Getenv("SHOPPAGE_AUTH_SECRET")
	r.Get("/login", h.ServeLogin)
	r.With(web.RateLimit(10, time.Minute)).Post("/auth/login", h.Login)
	r.Post("/auth/logout", h.Logout)

	protected := chi.NewRouter()
	protected.Use(auth.RequireSession(authSecret))
	if opts.Workspaces != nil {
		protected.Use(persistWrites(state, opts.Workspaces))
	}
	protected.Get("/", h.ServeDashboard)
	protected.Get("/desk", h.ServeDashboard)
	protected.Get("/tab/{tab}", h.ServeTab)
	protected.Get("/merchant/search", h.Search)
	protected.Post("/undo/{id}", h.Undo)
	protected.NotFound(h.ServeNotFound)

	// Catalog & Product Operations
	protected.Get("/catalog/export.csv", h.ExportCatalogCSV)
	protected.Get("/catalog/new", h.ServeProductNew)
	protected.Get("/catalog/import-template.csv", h.ServeImportTemplate)
	protected.Post("/catalog/import", h.ImportCatalog)
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
	protected.Post("/rfqs/{id}/quote", h.SendQuote)

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
	return r, nil
}

// persistWrites makes every successful state-changing request durable before
// its response reaches the merchant. The handler's response is buffered; if
// the snapshot cannot be saved the merchant gets a 503 instead of a false
// success. Saves are serialised so snapshots land in order.
func persistWrites(state *handlers.MerchantStoreState, store WorkspaceStore) func(http.Handler) http.Handler {
	var saveMu sync.Mutex
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodGet, http.MethodHead, http.MethodOptions:
				next.ServeHTTP(w, r)
				return
			}
			buf := &bufferedResponse{header: http.Header{}, status: http.StatusOK}
			next.ServeHTTP(buf, r)

			if buf.status < 500 {
				saveMu.Lock()
				snap, err := state.MarshalSnapshot()
				if err == nil {
					err = store.Save(r.Context(), state.TenantID(), snap)
				}
				saveMu.Unlock()
				if err != nil {
					slog.Error("workspace save failed", "err", err, "path", r.URL.Path,
						"request_id", middleware.GetReqID(r.Context()))
					http.Error(w, "Your change could not be saved. Please try again in a moment.",
						http.StatusServiceUnavailable)
					return
				}
			}
			for k, v := range buf.header {
				w.Header()[k] = v
			}
			w.WriteHeader(buf.status)
			_, _ = w.Write(buf.body.Bytes())
		})
	}
}

type bufferedResponse struct {
	header      http.Header
	status      int
	wroteHeader bool
	body        bytes.Buffer
}

func (b *bufferedResponse) Header() http.Header { return b.header }

func (b *bufferedResponse) WriteHeader(code int) {
	if !b.wroteHeader {
		b.status, b.wroteHeader = code, true
	}
}

func (b *bufferedResponse) Write(p []byte) (int, error) {
	b.WriteHeader(http.StatusOK)
	return b.body.Write(p)
}
