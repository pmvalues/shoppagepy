package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/shoppage/consumer-web/internal/handlers"
	"github.com/shoppage/consumer-web/internal/store"
)

func makeReverseProxy(targetURL string, stripPrefix string) http.Handler {
	target, err := url.Parse(targetURL)
	if err != nil {
		log.Fatalf("Invalid target URL %s: %v", targetURL, err)
	}
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, e error) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusBadGateway)
		fmt.Fprintf(w, `<div style="font-family:sans-serif; padding:40px; text-align:center; max-width:600px; margin:0 auto;">`)
		fmt.Fprintf(w, `<h2 style="color:#0f172a;">Service Gateway Notice</h2>`)
		fmt.Fprintf(w, `<p style="color:#64748b;">The upstream service at <code>%s</code> is currently offline or unreachable.</p>`, targetURL)
		fmt.Fprintf(w, `<p style="margin-top:20px;"><a href="/" style="display:inline-block; padding:10px 18px; background:#059669; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold;">Return to Shoppage Grid</a></p>`)
		fmt.Fprintf(w, `</div>`)
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if stripPrefix != "" {
			r.URL.Path = strings.TrimPrefix(r.URL.Path, stripPrefix)
			if r.URL.Path == "" {
				r.URL.Path = "/"
			}
		}
		proxy.ServeHTTP(w, r)
	})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	st := store.NewStore()
	h := handlers.NewConsumerHandler(st)

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
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
	r.Post("/feed/post", h.HandleBroadcastPost)
	r.Get("/location-modal", h.HandleLocationModal)
	r.Get("/malls", h.HandleMalls)
	r.Get("/malls/{id}", h.HandleMallDetail)
	r.Get("/m/{id}", h.HandleStorefront)

	// Short streams & Buyer wholesale RFQ
	r.Get("/shorts", h.HandleShorts)
	r.Get("/shows", h.HandleShorts)
	r.Get("/requests", h.HandleRequests)

	// Live Consumer Chat Desk (Direct Messages with Wholesalers)
	r.Get("/chat", h.HandleChat)

	// Gemini AI Assistant endpoint
	r.Post("/api/assistant", h.HandleAssistant)
	r.Get("/api/assistant", h.HandleAssistant)

	// PWA Manifest and Service Worker
	r.Get("/manifest.json", h.HandleManifest)
	r.Get("/sw.js", h.HandleServiceWorker)

	// System Health
	r.Get("/health", h.HandleHealth)
	r.Get("/healthz", h.HandleHealth)
	r.Get("/api/health", h.HandleHealth)
	r.Get("/api/ops/health", h.HandleHealth)
	r.Get("/api/ops/ready", h.HandleHealth)

	// Unified Gateway Reverse Proxies
	merchantURL := os.Getenv("MERCHANT_OS_URL")
	if merchantURL == "" {
		merchantURL = "http://localhost:8083"
	}
	chatURL := os.Getenv("CHAT_GATEWAY_URL")
	if chatURL == "" {
		chatURL = "http://localhost:8080"
	}
	searchURL := os.Getenv("SEARCH_CORE_URL")
	if searchURL == "" {
		searchURL = "http://localhost:8082"
	}

	// 1. Merchant OS Workstation (:8083)
	merchantProxy := makeReverseProxy(merchantURL, "")
	r.Mount("/desk", makeReverseProxy(merchantURL, "/desk"))
	r.Mount("/merchant", merchantProxy)
	r.Mount("/tab", merchantProxy)
	r.Post("/chat/send", merchantProxy.ServeHTTP)
	r.Post("/chat/quote", merchantProxy.ServeHTTP)
	r.Get("/chat/thread/*", merchantProxy.ServeHTTP)
	r.Mount("/orders", merchantProxy)
	r.Mount("/catalog", merchantProxy)
	r.Mount("/inventory", merchantProxy)
	r.Mount("/rfqs", merchantProxy)
	r.Mount("/pos", merchantProxy)
	r.Mount("/scan", merchantProxy)
	r.Mount("/feeds", merchantProxy)
	r.Mount("/settings", merchantProxy)
	r.Mount("/channels", merchantProxy)
	r.Mount("/discounts", merchantProxy)
	r.Mount("/transfers", merchantProxy)
	r.Mount("/manifests", merchantProxy)
	r.Mount("/media", merchantProxy)
	r.Mount("/editor", merchantProxy)
	r.Mount("/copilot", merchantProxy)
	r.Mount("/audit-logs", merchantProxy)
	r.Mount("/flow", merchantProxy)

	// 2. Chat Gateway & WebSockets (:8080)
	r.Mount("/ws", makeReverseProxy(chatURL, ""))

	// 3. Search Core (:8082)
	r.Mount("/api/search", makeReverseProxy(searchURL, ""))

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 20 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		fmt.Println("================================================================")
		fmt.Printf("⚡ SHOPPAGE PURE GO UNIFIED PLATFORM\n")
		fmt.Printf("   Web & PWA:       http://localhost:%s\n", port)
		fmt.Printf("   Live Chat Desk:  http://localhost:%s/chat\n", port)
		fmt.Printf("   Search Grid:     http://localhost:%s/search?q=solar\n", port)
		fmt.Printf("   Merchant Desk:   http://localhost:%s/desk\n", port)
		fmt.Printf("   Malls Directory: http://localhost:%s/malls\n", port)
		fmt.Printf("   AI Assistant:    http://localhost:%s/api/assistant\n", port)
		fmt.Printf("   System Health:   http://localhost:%s/health\n", port)
		fmt.Println("================================================================")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Unified Go server failed: %v", err)
		}
	}()

	<-stop
	fmt.Println("\nShutting down Unified Go Platform gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}
	fmt.Println("Unified Go Platform stopped.")
}
