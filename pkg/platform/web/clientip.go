// Package web holds the HTTP middleware shared by every Shoppage service:
// client-IP resolution, security headers, cross-origin protection, rate
// limiting, structured request logging, panic recovery and metrics.
package web

import (
	"net"
	"net/http"
	"net/netip"
	"os"
	"strings"

	"github.com/go-chi/chi/v5/middleware"
)

// DefaultTrustedProxies covers loopback and private networks, which is where
// Caddy (or a container-network neighbour) sits in the supported deployments.
// Public addresses are never trusted, so an internet client cannot spoof its
// IP by sending X-Forwarded-For.
var DefaultTrustedProxies = []string{
	"127.0.0.0/8", "::1/128",
	"10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16",
	"fc00::/7",
}

// TrustedProxiesFromEnv reads TRUSTED_PROXIES (comma-separated CIDRs).
// Unset uses DefaultTrustedProxies; "none" trusts no proxy at all, for hosts
// that serve clients directly. Invalid entries panic at startup.
func TrustedProxiesFromEnv() []string {
	raw := strings.TrimSpace(os.Getenv("TRUSTED_PROXIES"))
	switch {
	case raw == "":
		return DefaultTrustedProxies
	case strings.EqualFold(raw, "none"):
		return nil
	}
	var out []string
	for _, p := range strings.Split(raw, ",") {
		if p = strings.TrimSpace(p); p != "" {
			netip.MustParsePrefix(p)
			out = append(out, p)
		}
	}
	return out
}

// ClientIP resolves the client address from the TCP peer, and consults
// X-Forwarded-For only when that peer is itself a trusted proxy. It replaces
// chi's deprecated middleware.RealIP, which believed any client-supplied
// header. Read the result with ClientIPOf.
func ClientIP(trustedPrefixes []string) func(http.Handler) http.Handler {
	prefixes := make([]netip.Prefix, len(trustedPrefixes))
	for i, p := range trustedPrefixes {
		prefixes[i] = netip.MustParsePrefix(p)
	}
	return func(next http.Handler) http.Handler {
		fromXFF := middleware.ClientIPFromXFF(trustedPrefixes...)(next)
		return middleware.ClientIPFromRemoteAddr(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if peer := middleware.GetClientIPAddr(r.Context()); peer.IsValid() && inAny(peer, prefixes) {
				fromXFF.ServeHTTP(w, r)
				return
			}
			next.ServeHTTP(w, r)
		}))
	}
}

// ClientIPOf returns the resolved client IP, falling back to the TCP peer
// when no ClientIP middleware ran (for example in unit tests).
func ClientIPOf(r *http.Request) string {
	if ip := middleware.GetClientIP(r.Context()); ip != "" {
		return ip
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func inAny(ip netip.Addr, prefixes []netip.Prefix) bool {
	for _, p := range prefixes {
		if p.Contains(ip) {
			return true
		}
	}
	return false
}
