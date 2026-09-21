package crawler

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/shoppage/sweeper-engine/internal/models"
	"github.com/shoppage/sweeper-engine/internal/normalizer"
)

// SweepJob represents a batch sweeping task across geographic bounding boxes or public data sources
type SweepJob struct {
	Source   models.SourceKind
	Region   string
	Records  []models.RawMerchantRecord
}

// Pool represents a concurrent worker pool processing raw merchant streams
type Pool struct {
	concurrency int
	inbound     chan models.RawMerchantRecord
	outbound    chan models.NormalizedMerchantRecord
	wg          sync.WaitGroup
}

// NewPool initializes a Worker Pool with the designated concurrency limit
func NewPool(concurrency int, bufferSize int) *Pool {
	if concurrency <= 0 {
		concurrency = 4
	}
	if bufferSize <= 0 {
		bufferSize = 1000
	}

	return &Pool{
		concurrency: concurrency,
		inbound:     make(chan models.RawMerchantRecord, bufferSize),
		outbound:    make(chan models.NormalizedMerchantRecord, bufferSize),
	}
}

// Start launches worker goroutines
func (p *Pool) Start(ctx context.Context) {
	for i := 0; i < p.concurrency; i++ {
		p.wg.Add(1)
		go func(workerID int) {
			defer p.wg.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case raw, ok := <-p.inbound:
					if !ok {
						return
					}
					// Process through normalizer
					clean := normalizer.NormalizeRecord(raw)
					p.outbound <- clean
				}
			}
		}(i)
	}
}

// Submit enqueues a raw record for normalization
func (p *Pool) Submit(record models.RawMerchantRecord) {
	p.inbound <- record
}

// Close gracefully closes inbound channel and waits for workers to complete
func (p *Pool) Close() {
	close(p.inbound)
	p.wg.Wait()
	close(p.outbound)
}

// Outbound returns the channel with processed normalized records
func (p *Pool) Outbound() <-chan models.NormalizedMerchantRecord {
	return p.outbound
}

// ProcessBatch synchronously processes a slice of raw records and returns cleaned records
func ProcessBatch(ctx context.Context, records []models.RawMerchantRecord, workers int) ([]models.NormalizedMerchantRecord, time.Duration) {
	start := time.Now()
	pool := NewPool(workers, len(records)+10)
	pool.Start(ctx)

	var results []models.NormalizedMerchantRecord
	done := make(chan struct{})

	go func() {
		for norm := range pool.Outbound() {
			results = append(results, norm)
		}
		close(done)
	}()

	for _, rec := range records {
		pool.Submit(rec)
	}
	pool.Close()
	<-done

	elapsed := time.Since(start)
	slog.Info("Processed raw records batch", "count", len(results), "duration", elapsed.String())
	return results, elapsed
}
