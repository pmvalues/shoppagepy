package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/shoppage/sweeper-engine/internal/crawler"
	"github.com/shoppage/sweeper-engine/internal/models"
)

func main() {
	region := flag.String("region", "Western Cape", "Target South African Province/Region")
	workers := flag.Int("workers", 8, "Number of concurrent worker goroutines")
	flag.Parse()

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	slog.Info("Starting Shoppage Data Sweeper Engine", "region", *region, "workers", *workers)

	// Sample synthetic / seed public records representing swept OpenStreetMap / GMB entries
	seedRecords := []models.RawMerchantRecord{
		{
			Source:      models.SourceOSM,
			SourceID:    "osm_101",
			Name:        "Cape Auto Spares",
			Category:    "Automotive Parts",
			Address:     "44 Voortrekker Rd, Bellville",
			City:        "Cape Town",
			Province:    *region,
			Phone:       "021 948 1234",
			Email:       "info@capeauto.co.za",
			Latitude:    -33.8988,
			Longitude:   18.6298,
			CollectedAt: time.Now().UTC(),
		},
		{
			Source:      models.SourceGMB,
			SourceID:    "gmb_202",
			Name:        "Table Mountain Hardware",
			Category:    "Building Supplies",
			Address:     "15 Kloof St, Gardens",
			City:        "Cape Town",
			Province:    *region,
			Phone:       "(021) 424 5555",
			Email:       "sales@tmhardware.co.za",
			Latitude:    -33.9312,
			Longitude:   18.4112,
			CollectedAt: time.Now().UTC(),
		},
		{
			Source:      models.SourceWeb,
			SourceID:    "web_303",
			Name:        "Karoo Fresh Produce & Meats",
			Category:    "Butchery & Fresh Foods",
			Address:     "88 Church St",
			City:        "Oudtshoorn",
			Province:    *region,
			Phone:       "044 272 9000",
			Latitude:    -33.5907,
			Longitude:   22.2014,
			CollectedAt: time.Now().UTC(),
		},
	}

	ctx := context.Background()
	results, duration := crawler.ProcessBatch(ctx, seedRecords, *workers)

	fmt.Printf("\n--- Sweep Execution Completed in %v ---\n", duration)
	fmt.Printf("Total Records Cleaned and Normalized: %d\n\n", len(results))

	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	_ = enc.Encode(results)
}
