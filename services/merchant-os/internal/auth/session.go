// Package auth provides cookie-session authentication for the Merchant OS.
// Sessions are HMAC-signed with SHOPPAGE_AUTH_SECRET; without a configured
// secret the middleware fails closed (all protected routes return 401).
package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"
)

const (
	// CookieName is the session cookie set on successful login.
	CookieName = "shoppage_session"
	// sessionTTL is how long a session remains valid.
	sessionTTL = 12 * time.Hour
)

type sessionPayload struct {
	Email string `json:"email"`
	Exp   int64  `json:"exp"`
	Nonce string `json:"nonce"`
}

func secretKey() []byte {
	s := os.Getenv("SHOPPAGE_AUTH_SECRET")
	return []byte(s)
}

func sign(data string, key []byte) []byte {
	m := hmac.New(sha256.New, key)
	m.Write([]byte(data))
	return m.Sum(nil)
}

// EncodeSession builds a signed session token: base64(json).base64(hmac).
func EncodeSession(email string, key []byte) (string, error) {
	nonce := make([]byte, 8)
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	p := sessionPayload{
		Email: email,
		Exp:   time.Now().Add(sessionTTL).Unix(),
		Nonce: base64.RawURLEncoding.EncodeToString(nonce),
	}
	body, err := json.Marshal(p)
	if err != nil {
		return "", err
	}
	sig := sign(string(body), key)
	return base64.RawURLEncoding.EncodeToString(body) + "." + base64.RawURLEncoding.EncodeToString(sig), nil
}

// DecodeSession verifies the signature and expiry of a session token.
func DecodeSession(token string, key []byte) (sessionPayload, bool) {
	var zero sessionPayload
	if token == "" || len(key) == 0 {
		return zero, false
	}
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return zero, false
	}
	body, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return zero, false
	}
	sig, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return zero, false
	}
	expect := sign(string(body), key)
	if subtle.ConstantTimeCompare(sig, expect) != 1 {
		return zero, false
	}
	var p sessionPayload
	if err := json.Unmarshal(body, &p); err != nil {
		return zero, false
	}
	if time.Now().Unix() > p.Exp {
		return zero, false
	}
	return p, true
}

// VerifyPassword checks the platform admin credentials from the environment.
// Fails closed if SHOPPAGE_AUTH_SECRET or SHOPPAGE_ADMIN_PASSWORD is unset.
func VerifyPassword(email, password string) bool {
	key := secretKey()
	if len(key) < 32 {
		return false
	}
	wantEmail := os.Getenv("SHOPPAGE_ADMIN_EMAIL")
	wantPass := os.Getenv("SHOPPAGE_ADMIN_PASSWORD")
	if wantEmail == "" || wantPass == "" {
		return false
	}
	okEmail := subtle.ConstantTimeCompare([]byte(strings.ToLower(email)), []byte(strings.ToLower(wantEmail))) == 1
	okPass := subtle.ConstantTimeCompare([]byte(password), []byte(wantPass)) == 1
	return okEmail && okPass
}

// SetSessionCookie writes the signed session cookie (HttpOnly, Lax).
func SetSessionCookie(w http.ResponseWriter, token string, secure bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   secure,
		MaxAge:   int(sessionTTL.Seconds()),
	})
}

// ClearSessionCookie removes the session cookie.
func ClearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}

// RequireSession is chi middleware that rejects requests without a valid
// session cookie. Fails closed when SHOPPAGE_AUTH_SECRET is missing/short.
// Unconfigured auth returns a branded HTML page, never raw JSON.
func RequireSession(secret string) func(http.Handler) http.Handler {
	key := []byte(secret)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if len(key) < 32 {
				writeUnconfiguredPage(w)
				return
			}
			c, err := r.Cookie(CookieName)
			if err != nil {
				http.Redirect(w, r, "/login", http.StatusSeeOther)
				return
			}
			if _, ok := DecodeSession(c.Value, key); !ok {
				ClearSessionCookie(w)
				http.Redirect(w, r, "/login", http.StatusSeeOther)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// writeUnconfiguredPage serves a branded HTML error when the auth secret is
// missing or too short. Fails closed (no session issued) but avoids leaking
// raw JSON to browser address-bar requests.
func writeUnconfiguredPage(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusServiceUnavailable)
	_, _ = w.Write([]byte(unconfiguredHTML))
}

const unconfiguredHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Merchant OS — Setup required</title>
<style>
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: #0f172a; color:#e2e8f0; }
.card { width:min(420px, 92vw); background:#1e293b; border:1px solid #334155;
  border-radius:14px; padding:2rem; text-align:center; }
h1 { margin:0 0 .5rem; font-size:1.25rem; font-weight:600; color:#f8fafc; }
p { margin:0 0 1.25rem; color:#94a3b8; font-size:.875rem; line-height:1.5; }
code { background:#0f172a; padding:.15rem .4rem; border-radius:4px; color:#6ee7b7; font-size:.85em; }
a { display:inline-block; padding:.6rem 1.2rem; border-radius:8px; background:#059669;
  color:#fff; font-weight:600; text-decoration:none; font-size:.95rem; }
a:hover { background:#047857; }
</style>
</head>
<body>
<div class="card">
  <h1>Merchant OS not configured</h1>
  <p>This instance needs <code>SHOPPAGE_AUTH_SECRET</code> (32+ characters) before the desk can sign you in.</p>
  <a href="/">Back to Shoppage</a>
</div>
</body>
</html>`
