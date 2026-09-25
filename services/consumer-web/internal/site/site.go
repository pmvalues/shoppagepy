// Package site centralises instance-level configuration that used to be
// hardcoded into handlers and templates (canonical base URL, app version).
//
// Every value is resolved from the environment first so that a deployment can
// be re-pointed without touching source. Where no environment value exists the
// helpers fall back to the incoming request (for URLs) or an explicit
// "unset" marker, never to a fabricated literal.
package site

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"os"
	"strconv"
	"strings"
)

// Environment keys read by this package.
const (
	// EnvPublicURL is the canonical origin of this Shoppage instance,
	// e.g. https://www.shoppage.co.za. Used for sitemaps, robots.txt and
	// schema.org payloads. When unset, URLs are derived from the live request.
	EnvPublicURL = "SHOPPAGE_PUBLIC_URL"

	// EnvVersion is the build/release version reported by /health.
	EnvVersion = "SHOPPAGE_VERSION"

	// EnvVATRate is the VAT rate applied to quoted totals, as a decimal
	// (0.15 = 15%). Defaults to the South African standard rate.
	EnvVATRate = "SHOPPAGE_VAT_RATE"

	// EnvCompanyLegalName, EnvCompanyCIPC and EnvCompanyVATNumber hold the
	// operating entity's registered particulars. They are shown in the site
	// footer only when configured — the app never invents a registration
	// number, because a fabricated CIPC/VAT stamp is indistinguishable from
	// fraud during investor due diligence.
	EnvCompanyLegalName = "SHOPPAGE_COMPANY_LEGAL_NAME"
	EnvCompanyCIPC      = "SHOPPAGE_COMPANY_CIPC"
	EnvCompanyVATNumber = "SHOPPAGE_COMPANY_VAT_NUMBER"

	// EnvMerchantOSURL is the public origin of the Merchant OS app, used by
	// cross-app links. Empty means "not deployed alongside this instance".
	EnvMerchantOSURL = "SHOPPAGE_MERCHANT_OS_URL"

	// EnvChatGatewayWS is the WebSocket origin of the chat gateway,
	// e.g. wss://chat.shoppage.co.za. Empty means live chat is unavailable.
	EnvChatGatewayWS = "SHOPPAGE_CHAT_GATEWAY_WS"

	// EnvGeminiAPIKey and EnvGeminiModel configure the assistant. Without a key
	// the assistant runs on the offline rules engine and the UI must say so.
	EnvGeminiAPIKey = "GEMINI_API_KEY"
	EnvGeminiModel  = "GEMINI_MODEL"
)

// DefaultGeminiModel is used when a key is configured but no model is pinned.
// Google limits the 2.5 family to accounts that already used it, so new keys
// need a 3.x model. Override with GEMINI_MODEL.
const DefaultGeminiModel = "gemini-3.6-flash"

// DefaultVATRate is the South African standard VAT rate. It is a statutory
// default, overridable per instance via EnvVATRate.
const DefaultVATRate = 0.15

// BaseURL returns the configured canonical origin, or "" when unset.
func BaseURL() string {
	return strings.TrimRight(strings.TrimSpace(os.Getenv(EnvPublicURL)), "/")
}

// Version returns the configured release version, or "" when unset.
// Callers must treat "" as unknown rather than inventing a number.
func Version() string {
	return strings.TrimSpace(os.Getenv(EnvVersion))
}

// VATRate returns the configured VAT rate, falling back to DefaultVATRate.
// An unparseable override is ignored rather than silently zeroing tax.
func VATRate() float64 {
	raw := strings.TrimSpace(os.Getenv(EnvVATRate))
	if raw == "" {
		return DefaultVATRate
	}
	if v, err := strconv.ParseFloat(raw, 64); err == nil && v >= 0 && v < 1 {
		return v
	}
	return DefaultVATRate
}

// VATPercentLabel renders the VAT rate as a whole-percent label ("15%").
func VATPercentLabel() string {
	pct := VATRate() * 100
	if pct == float64(int64(pct)) {
		return strconv.FormatInt(int64(pct), 10) + "%"
	}
	return strconv.FormatFloat(pct, 'g', -1, 64) + "%"
}

// CompanyLegalName returns the registered operating entity name, or "".
func CompanyLegalName() string {
	return strings.TrimSpace(os.Getenv(EnvCompanyLegalName))
}

// CompanyCIPC returns the CIPC registration number, or "" when not configured.
func CompanyCIPC() string {
	return strings.TrimSpace(os.Getenv(EnvCompanyCIPC))
}

// CompanyVATNumber returns the SARS VAT number, or "" when not configured.
func CompanyVATNumber() string {
	return strings.TrimSpace(os.Getenv(EnvCompanyVATNumber))
}

// MerchantOSURL returns the Merchant OS origin, or "" when not configured.
func MerchantOSURL() string {
	return strings.TrimRight(strings.TrimSpace(os.Getenv(EnvMerchantOSURL)), "/")
}

// MerchantDeskURL returns the absolute URL for the Merchant OS chat desk.
// consumer-web reverse-proxies /desk to the Merchant OS service, so when no
// external origin is configured the same-origin gateway path is used rather
// than a hardcoded host and port.
func MerchantDeskURL() string {
	if base := MerchantOSURL(); base != "" {
		return base + "/tab/chat"
	}
	return "/desk/tab/chat"
}

// ChatGatewaySameOrigin tells the chat page to connect to /ws/chat on the
// origin it was served from (ws:// or wss:// to match the page).
const ChatGatewaySameOrigin = "same-origin"

// ChatGatewayWS returns the chat gateway WebSocket origin. When the env var is
// unset it returns ChatGatewaySameOrigin: the platform binary serves /ws/chat
// itself, so the browser connects back to the host it loaded the page from.
func ChatGatewayWS() string {
	if v := strings.TrimRight(strings.TrimSpace(os.Getenv(EnvChatGatewayWS)), "/"); v != "" {
		return v
	}
	return ChatGatewaySameOrigin
}

// GeminiConfigured reports whether a live AI key is present.
func GeminiConfigured() bool {
	return strings.TrimSpace(os.Getenv(EnvGeminiAPIKey)) != ""
}

// GeminiModel returns the configured model id, or DefaultGeminiModel when a key
// is set but no model is pinned. Returns "" when no AI key is configured, so
// the UI can never advertise a model this instance cannot call.
func GeminiModel() string {
	if !GeminiConfigured() {
		return ""
	}
	if m := strings.TrimSpace(os.Getenv(EnvGeminiModel)); m != "" {
		return m
	}
	return DefaultGeminiModel
}

// RequestBaseURL resolves the origin for the current request:
// configured canonical origin first, then the request's own scheme/host.
// The result never contains a trailing slash.
func RequestBaseURL(r *http.Request) string {
	if b := BaseURL(); b != "" {
		return b
	}
	if r == nil || r.Host == "" {
		return ""
	}
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	if fwd := strings.TrimSpace(r.Header.Get("X-Forwarded-Proto")); fwd != "" {
		if i := strings.IndexByte(fwd, ','); i > 0 {
			fwd = fwd[:i]
		}
		if strings.EqualFold(strings.TrimSpace(fwd), "https") {
			scheme = "https"
		} else {
			scheme = "http"
		}
	}
	return scheme + "://" + r.Host
}

// NewID returns prefix followed by 10 random uppercase hex characters, e.g.
// "ORD-DEMO-3F9A0C1B2D". Randomness keeps identifiers unique across restarts
// and replicas, which a clock-derived suffix does not.
func NewID(prefix string) string {
	b := make([]byte, 5)
	if _, err := rand.Read(b); err != nil {
		panic("crypto/rand unavailable: " + err.Error())
	}
	return prefix + strings.ToUpper(hex.EncodeToString(b))
}
