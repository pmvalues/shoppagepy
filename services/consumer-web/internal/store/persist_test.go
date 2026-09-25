package store

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"github.com/shoppage/consumer-web/internal/models"
)

type fakePersister struct {
	docs map[string][]json.RawMessage
	fail bool
}

func (f *fakePersister) Put(_ context.Context, kind, _ string, doc any) error {
	if f.fail {
		return errors.New("db down")
	}
	b, _ := json.Marshal(doc)
	f.docs[kind] = append(f.docs[kind], b)
	return nil
}

func (f *fakePersister) List(_ context.Context, kind string) ([]json.RawMessage, error) {
	return f.docs[kind], nil
}

func TestRecordsSurviveRestart(t *testing.T) {
	p := &fakePersister{docs: map[string][]json.RawMessage{}}
	s1 := NewStore()
	if err := s1.AttachPersistence(context.Background(), p); err != nil {
		t.Fatal(err)
	}
	if err := s1.CreateOrder(models.PlacedOrder{OrderNumber: "ORD-DEMO-ABC", Waybill: "WB-1"}); err != nil {
		t.Fatal(err)
	}
	if err := s1.AddMerchant(models.MerchantStorefront{ID: "new-supplier", Name: "New Supplier"}); err != nil {
		t.Fatal(err)
	}
	if err := s1.AddStoreTestimonial("new-supplier", models.StoreTestimonial{ID: "t_1", Text: "great"}); err != nil {
		t.Fatal(err)
	}
	if err := s1.AddPost(models.PostItem{ID: "post-1"}); err != nil {
		t.Fatal(err)
	}

	s2 := NewStore()
	if err := s2.AttachPersistence(context.Background(), p); err != nil {
		t.Fatal(err)
	}
	if _, ok := s2.GetOrderByNumber("ord-demo-abc"); !ok {
		t.Fatal("order lost across restart")
	}
	m, ok := s2.GetMerchantByID("new-supplier")
	if !ok {
		t.Fatal("registered supplier lost across restart")
	}
	if len(m.Testimonials) == 0 || m.Testimonials[0].ID != "t_1" {
		t.Fatalf("review lost across restart: %+v", m.Testimonials)
	}
	if posts := s2.GetFeedPosts("", ""); len(posts) == 0 || posts[0].ID != "post-1" {
		t.Fatal("post lost or not first after restart")
	}
}

func TestFailedWriteIsNotVisible(t *testing.T) {
	p := &fakePersister{docs: map[string][]json.RawMessage{}, fail: true}
	s := NewStore()
	s.persist = p
	if err := s.CreateOrder(models.PlacedOrder{OrderNumber: "ORD-X"}); err == nil {
		t.Fatal("expected error")
	}
	if _, ok := s.GetOrderByNumber("ORD-X"); ok {
		t.Fatal("order visible although it was never saved")
	}
}

func TestRegistrationCannotOverwriteStorefront(t *testing.T) {
	s := NewStore()
	existing := s.GetAllMerchants()
	if len(existing) == 0 {
		t.Skip("no seed merchants loaded")
	}
	err := s.AddMerchant(models.MerchantStorefront{ID: existing[0].ID, Name: "Impostor"})
	if !errors.Is(err, ErrMerchantExists) {
		t.Fatalf("want ErrMerchantExists, got %v", err)
	}
	if m, _ := s.GetMerchantByID(existing[0].ID); m.Name == "Impostor" {
		t.Fatal("existing storefront was overwritten")
	}
}
