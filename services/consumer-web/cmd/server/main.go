// Command server is the Shoppage platform binary. It serves the consumer web
// app and, by default, mounts Merchant OS, the chat gateway and the search
// core in-process, so one process and one port run the whole platform. Set
// MERCHANT_OS_URL, CHAT_GATEWAY_URL or SEARCH_CORE_URL to route that part to
// a separately deployed service instead.
package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	chatapp "github.com/shoppage/chat-gateway/app"
	"github.com/shoppage/consumer-web/internal/assets"
	"github.com/shoppage/consumer-web/internal/handlers"
	"github.com/shoppage/consumer-web/internal/store"
	"github.com/shoppage/consumer-web/internal/templates"
	merchantapp "github.com/shoppage/merchant-os/app"
	"github.com/shoppage/platform/db"
	"github.com/shoppage/platform/env"
	"github.com/shoppage/platform/obs"
	"github.com/shoppage/platform/web"
	searchapp "github.com/shoppage/search-core/app"
)

func makeReverseProxy(targetURL string) *httputil.ReverseProxy {
	target, err := url.Parse(targetURL)
	if err != nil {
		fatal("invalid upstream URL", err, "url", targetURL)
	}
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, e error) {
		slog.Error("upstream unavailable", "upstream", target.Host, "err", e)
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusBadGateway)
		fmt.Fprint(w, `<div style="font-family:sans-serif; padding:40px; text-align:center; max-width:600px; margin:0 auto;">`+
			`<h2 style="color:#0f172a;">Service temporarily unavailable</h2>`+
			`<p style="color:#64748b;">This part of Shoppage is not responding right now. Please try again shortly.</p>`+
			`<p style="margin-top:20px;"><a href="/" style="display:inline-block; padding:10px 18px; background:#059669; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold;">Return to Shoppage</a></p></div>`)
	}
	return proxy
}

// upstream mounts a component either in-process (default) or, when envKey
// holds a URL, through a reverse proxy to the separately deployed service.
// stripPrefix mirrors how that service expects the path.
type upstream struct {
	remote *httputil.ReverseProxy
	local  http.Handler
}

func (u upstream) at(stripPrefix string) http.Handler {
	if u.remote != nil {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if stripPrefix != "" {
				r.URL.Path = strings.TrimPrefix(r.URL.Path, stripPrefix)
				if r.URL.Path == "" {
					r.URL.Path = "/"
				}
			}
			u.remote.ServeHTTP(w, r)
		})
	}
	return web.InProcess(u.local, stripPrefix)
}

func resolve(name, envKey string, build func() (http.Handler, error)) upstream {
	if raw := strings.TrimSpace(os.Getenv(envKey)); raw != "" {
		slog.Info("component proxied to remote service", "component", name, "url", raw)
		return upstream{remote: makeReverseProxy(raw)}
	}
	h, err := build()
	if err != nil {
		fatal("component failed to start", err, "component", name)
	}
	slog.Info("component mounted in-process", "component", name)
	return upstream{local: h}
}

func fatal(msg string, err error, attrs ...any) {
	slog.Error(msg, append([]any{"err", err}, attrs...)...)
	os.Exit(1)
}

func main() {
	production := env.IsProduction()
	flush := obs.Setup("shoppage", production)
	defer flush()
	ctx := context.Background()

	pool, err := db.OpenFromEnv(ctx, production)
	if err != nil {
		fatal("database unavailable", err)
	}
	if pool != nil {
		defer pool.Close()
	}

	st := store.NewStore()
	if pool != nil {
		if err := st.AttachPersistence(ctx, db.NewRecords(pool)); err != nil {
			fatal("restoring consumer records failed", err)
		}
	}
	h := handlers.NewConsumerHandler(st)

	// Templates render live catalogue counters instead of hardcoded scale
	// claims; the provider keeps the store out of the template layer.
	templates.SetStatsProvider(func() templates.PlatformStats {
		malls, products, deals, merchants := st.GetTotalCounts()
		var retailers []templates.RetailerStat
		for _, r := range st.GetRetailers() {
			retailers = append(retailers, templates.RetailerStat{Key: r.Key, Label: r.Label, Deals: r.Deals})
		}
		return templates.PlatformStats{
			Merchants:      merchants,
			Products:       products,
			Malls:          malls,
			Deals:          deals,
			Retailers:      retailers,
			MaxDiscountPct: st.MaxDiscountPct(),
			SampleData:     st.SampleDataInUse(),
			DataNotice:     st.DataNotice(),
		}
	})

	merchant := resolve("merchant-os", "MERCHANT_OS_URL", func() (http.Handler, error) {
		opts := merchantapp.Options{}
		if pool != nil {
			opts.Workspaces = db.NewWorkspaces(pool)
		}
		return merchantapp.New(ctx, opts)
	})
	var chatClose func()
	chat := resolve("chat-gateway", "CHAT_GATEWAY_URL", func() (http.Handler, error) {
		a, err := chatapp.New(chatapp.Options{})
		if err != nil {
			return nil, err
		}
		chatClose = a.Close
		return a.Handler, nil
	})
	if chatClose != nil {
		defer chatClose()
	}
	search := resolve("search-core", "SEARCH_CORE_URL", func() (http.Handler, error) {
		return searchapp.New(searchapp.Options{}), nil
	})
	if search.local != nil {
		st.SetSearchCoreClient(&http.Client{Transport: web.InProcessTransport(search.local), Timeout: time.Second})
	}

	ready := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if pool != nil {
			pctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
			defer cancel()
			if err := pool.Ping(pctx); err != nil {
				w.WriteHeader(http.StatusServiceUnavailable)
				fmt.Fprintln(w, `{"status":"unavailable","database":"down"}`)
				return
			}
		}
		fmt.Fprintln(w, `{"status":"ready"}`)
	}

	origins := env.AllowedOrigins()
	crossOrigin, err := web.CrossOriginProtection(origins)
	if err != nil {
		fatal("invalid ALLOWED_ORIGINS", err)
	}
	writeLimit := web.RateLimit(20, time.Minute)
	aiLimit := web.RateLimit(20, time.Minute)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(web.ClientIP(web.TrustedProxiesFromEnv()))
	r.Use(web.Observe("shoppage"))
	r.Use(web.Recover)
	r.Use(web.SecurityHeaders(web.DefaultCSP, "/embed/"))
	r.Use(crossOrigin)
	// Safety net for every route; tighter limits sit on writes and AI below.
	r.Use(web.RateLimit(600, time.Minute))
	r.Use(middleware.Compress(5))
	r.Use(middleware.Timeout(60 * time.Second))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "HX-Request", "HX-Target", "HX-Current-URL"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public Consumer Routes
	r.Get("/", h.HandleHome)
	r.Get("/search", h.HandleSearch)
	r.Get("/p/{id}", h.HandleProduct)
	r.Get("/buybox/{id}", h.HandleBuyBoxDrawer)
	r.Get("/offer/modal/{id}", h.HandleOfferModal)
	r.With(writeLimit).Post("/offer/submit", h.HandleSubmitOffer)
	r.With(writeLimit).Post("/feed/post", h.HandleBroadcastPost)
	r.Get("/location-modal", h.HandleLocationModal)
	r.Get("/malls", h.HandleMalls)
	r.Get("/malls/{id}", h.HandleMallDetail)
	r.Get("/m/{id}", h.HandleStorefront)
	r.Get("/store/{id}", h.HandleStorefront)
	r.Get("/embed/m/{id}", h.HandleStoreEmbed)
	r.Get("/embed/store/{id}", h.HandleStoreEmbed)
	r.Get("/badges/{type}.svg", h.HandleBadgeSVG)

	// Short streams & Buyer wholesale RFQ
	r.Get("/shorts", h.HandleShorts)
	r.Get("/shows", h.HandleShorts)
	r.Get("/requests", h.HandleRequests)

	// Live Consumer Chat Desk (Direct Messages with Wholesalers)
	r.Get("/chat", h.HandleChat)

	// SEO & Search Engine Parity
	r.Get("/sitemap.xml", h.HandleSitemapXML)
	r.Get("/robots.txt", h.HandleRobotsTXT)
	r.Get("/api/search/suggest", h.HandleSearchSuggest)

	// Interactive Buyer Reviews (GMB Parity)
	r.With(writeLimit).Post("/store/review", h.HandleStoreReviewSubmit)

	// Instant Checkout Simulator (Amazon Parity)
	r.With(writeLimit).Post("/checkout/instant", h.HandleInstantCheckout)

	// Real-Time Logistics & Courier Waybill Tracking
	r.Get("/track", h.HandleTrackOrder)

	// B2B Supplier Onboarding & Self-Service Provisioning
	r.Get("/sell", h.HandleSell)
	r.With(web.RateLimit(5, time.Minute)).Post("/sell/register", h.HandleSellRegister)

	// Gemini AI Assistant endpoint
	// Each call can reach a paid model: limit per client, on top of the
	// daily model-call budget (GEMINI_DAILY_LIMIT).
	r.With(aiLimit).Post("/api/assistant", h.HandleAssistant)
	r.With(aiLimit).Get("/api/assistant", h.HandleAssistant)

	// PWA Manifest, Favicon and Service Worker
	r.Get("/manifest.json", h.HandleManifest)
	r.Get("/sw.js", h.HandleServiceWorker)
	r.Get("/favicon.ico", h.HandleFavicon)
	r.Get("/favicon.svg", h.HandleFavicon)
	r.Get("/favicon.png", h.HandleFavicon)
	r.Get("/apple-touch-icon.png", h.HandleFavicon)
	r.Get("/apple-touch-icon-precomposed.png", h.HandleFavicon)

	// Static Assets (Pre-compiled Tailwind CSS & HTMX served directly from memory with 1-year immutable cache)
	r.Route("/static", func(sr chi.Router) {
		sr.Use(func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
				w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
				next.ServeHTTP(w, req)
			})
		})
		sr.Handle("/*", http.StripPrefix("/static", assets.Handler()))
	})

	// System Health
	r.Get("/health", h.HandleHealth)
	r.Get("/healthz", h.HandleHealth)
	r.Get("/api/health", h.HandleHealth)
	r.Get("/api/ops/health", h.HandleHealth)
	r.Get("/api/ops/ready", ready)
	r.Get("/readyz", ready)
	r.Handle("/metrics", web.MetricsHandler(production))

	// Merchant OS: /desk strips its prefix; session entry points and
	// workspace routes are forwarded as-is (the app serves them at the same
	// paths, and stripping would loop on its "/" → /login redirect).
	merchantAsIs := merchant.at("")
	r.Mount("/desk", merchant.at("/desk"))
	for _, p := range []string{"/login", "/auth", "/merchant", "/tab", "/orders", "/catalog", "/inventory",
		"/rfqs", "/pos", "/scan", "/feeds", "/settings", "/channels", "/discounts", "/transfers",
		"/manifests", "/media", "/editor", "/copilot", "/audit-logs", "/flow", "/rma"} {
		r.Mount(p, merchantAsIs)
	}
	r.Post("/chat/send", merchantAsIs.ServeHTTP)
	r.Post("/chat/quote", merchantAsIs.ServeHTTP)
	r.Get("/chat/thread/*", merchantAsIs.ServeHTTP)

	// Chat gateway WebSockets and the search core API.
	r.Mount("/ws", chat.at(""))
	r.Mount("/api/search", search.at(""))

	port := web.PortFromEnv("3000", "PORT")
	server := &http.Server{
		Addr:              ":" + port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		// Longer than the assistant's 25s model timeout so AI replies are
		// not cut off mid-response.
		WriteTimeout: 40 * time.Second,
		IdleTimeout:  120 * time.Second,
	}
	slog.Info("Shoppage platform starting", "port", port, "production", production, "database", pool != nil)
	if err := web.Serve(server); err != nil {
		fatal("server error", err)
	}
}
