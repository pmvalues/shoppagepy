package store

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/shoppage/consumer-web/internal/models"
)

// Persister is the durable record store (implemented by platform/db.Records).
type Persister interface {
	Put(ctx context.Context, kind, id string, doc any) error
	List(ctx context.Context, kind string) ([]json.RawMessage, error)
}

const (
	kindOrder       = "order"
	kindMerchant    = "merchant"
	kindPost        = "post"
	kindTestimonial = "testimonial"
)

type storedTestimonial struct {
	StoreID     string                  `json:"storeId"`
	Testimonial models.StoreTestimonial `json:"testimonial"`
}

// AttachPersistence makes subsequent writes durable and replays every stored
// record into memory, oldest first, so the process resumes where it stopped.
func (s *Store) AttachPersistence(ctx context.Context, p Persister) error {
	s.persist = p

	replay := func(kind string, apply func(json.RawMessage) error) error {
		docs, err := p.List(ctx, kind)
		if err != nil {
			return err
		}
		for _, d := range docs {
			if err := apply(d); err != nil {
				return fmt.Errorf("replay %s: %w", kind, err)
			}
		}
		if len(docs) > 0 {
			slog.Info("restored consumer records", "kind", kind, "count", len(docs))
		}
		return nil
	}

	// Merchants first: testimonials attach to storefronts.
	if err := replay(kindMerchant, func(d json.RawMessage) error {
		var m models.MerchantStorefront
		if err := json.Unmarshal(d, &m); err != nil {
			return err
		}
		s.addMerchant(m)
		return nil
	}); err != nil {
		return err
	}
	if err := replay(kindOrder, func(d json.RawMessage) error {
		var o models.PlacedOrder
		if err := json.Unmarshal(d, &o); err != nil {
			return err
		}
		s.mu.Lock()
		s.orders[o.OrderNumber] = o
		s.mu.Unlock()
		return nil
	}); err != nil {
		return err
	}
	if err := replay(kindPost, func(d json.RawMessage) error {
		var post models.PostItem
		if err := json.Unmarshal(d, &post); err != nil {
			return err
		}
		s.addPostLocked(post)
		return nil
	}); err != nil {
		return err
	}
	return replay(kindTestimonial, func(d json.RawMessage) error {
		var t storedTestimonial
		if err := json.Unmarshal(d, &t); err != nil {
			return err
		}
		s.addTestimonial(t.StoreID, t.Testimonial)
		return nil
	})
}

// SetSearchCoreClient overrides the HTTP client used to query the search
// core, e.g. with an in-process transport when it is mounted in this binary.
func (s *Store) SetSearchCoreClient(c *http.Client) { s.searchCore = c }

func (s *Store) save(kind, id string, doc any) error {
	if s.persist == nil {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.persist.Put(ctx, kind, id, doc)
}
