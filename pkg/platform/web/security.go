package web

import (
	"net/http"
	"strings"
)

// DefaultCSP allows the page's own scripts plus the inline handlers the templ
// views and HTMX rely on, Google Fonts, and remote product imagery. It still
// blocks third-party scripts, plugins, <base> hijacking and form posts to
// other origins.
const DefaultCSP = "default-src 'self'; " +
	"script-src 'self' 'unsafe-inline'; " +
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
	"font-src 'self' https://fonts.gstatic.com data:; " +
	"img-src 'self' data: blob: https:; " +
	"media-src 'self' blob: https:; " +
	"connect-src 'self' ws: wss:; " +
	"object-src 'none'; base-uri 'self'; form-action 'self'"

// SecurityHeaders sets baseline browser protections. Paths under any of
// embeddablePrefixes may be framed by third-party sites (the embeddable
// storefront); their handlers set their own frame-ancestors policy, so no
// X-Frame-Options is sent for them.
func SecurityHeaders(csp string, embeddablePrefixes ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := w.Header()
			h.Set("X-Content-Type-Options", "nosniff")
			h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
			h.Set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(self), payment=()")
			embeddable := false
			for _, p := range embeddablePrefixes {
				if strings.HasPrefix(r.URL.Path, p) {
					embeddable = true
					break
				}
			}
			if embeddable {
				h.Set("Content-Security-Policy", csp)
			} else {
				h.Set("X-Frame-Options", "SAMEORIGIN")
				h.Set("Content-Security-Policy", csp+"; frame-ancestors 'self'")
			}
			next.ServeHTTP(w, r)
		})
	}
}

// CrossOriginProtection rejects cross-site state-changing requests (CSRF)
// using the browser's Sec-Fetch-Site / Origin headers, via the standard
// library's http.CrossOriginProtection. Safe methods always pass. Origins in
// trusted (e.g. the www alias) may post cross-origin.
func CrossOriginProtection(trusted []string) (func(http.Handler) http.Handler, error) {
	cop := http.NewCrossOriginProtection()
	for _, o := range trusted {
		if err := cop.AddTrustedOrigin(o); err != nil {
			return nil, err
		}
	}
	cop.SetDenyHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "Cross-origin request blocked", http.StatusForbidden)
	}))
	return cop.Handler, nil
}
