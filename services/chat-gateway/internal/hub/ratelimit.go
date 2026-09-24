package hub

import (
	"sync"
	"time"
)

type rateEntry struct {
	tokens   float64
	last     time.Time
	lastSeen time.Time
}

type RateLimiter struct {
	mu      sync.Mutex
	entries map[string]*rateEntry
	rate    float64
	burst   float64
	ttl     time.Duration
}

func NewRateLimiter(perSecond float64, burst int) *RateLimiter {
	return &RateLimiter{
		entries: make(map[string]*rateEntry),
		rate:    perSecond,
		burst:   float64(burst),
		ttl:     10 * time.Minute,
	}
}

func (r *RateLimiter) Allow(key string) bool {
	if r == nil || key == "" {
		return true
	}
	now := time.Now()
	r.mu.Lock()
	defer r.mu.Unlock()
	if len(r.entries) > 10000 {
		for k, e := range r.entries {
			if now.Sub(e.lastSeen) > r.ttl {
				delete(r.entries, k)
			}
		}
	}
	e, ok := r.entries[key]
	if !ok {
		e = &rateEntry{tokens: r.burst, last: now, lastSeen: now}
		r.entries[key] = e
	}
	elapsed := now.Sub(e.last).Seconds()
	e.last = now
	e.lastSeen = now
	e.tokens += elapsed * r.rate
	if e.tokens > r.burst {
		e.tokens = r.burst
	}
	if e.tokens < 1 {
		return false
	}
	e.tokens--
	return true
}
