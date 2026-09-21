package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"sort"
	"sync"
	"time"
)

type RouteBenchmark struct {
	Name        string
	Method      string
	Path        string
	Body        []byte
	ContentType string
}

type BenchResult struct {
	Name        string
	TotalReqs   int
	SuccessReqs int
	RPS         float64
	Min         time.Duration
	Max         time.Duration
	Mean        time.Duration
	P50         time.Duration
	P90         time.Duration
	P99         time.Duration
}

func main() {
	baseURL := "http://localhost:3000"

	// Verify server is reachable
	resp, err := http.Get(baseURL + "/health")
	if err != nil || resp.StatusCode != http.StatusOK {
		fmt.Printf("❌ Error: Shoppage server is unreachable at %s\n", baseURL)
		fmt.Printf("   Ensure 'npm run dev' or 'PORT=3000' server is running.\n")
		return
	}
	_ = resp.Body.Close()

	routes := []RouteBenchmark{
		{
			Name:   "1. Raw Health Check",
			Method: "GET",
			Path:   "/health",
		},
		{
			Name:   "2. Home Grid (SSR + HTMX)",
			Method: "GET",
			Path:   "/",
		},
		{
			Name:   "3. Search SERP ('solar')",
			Method: "GET",
			Path:   "/search?q=solar",
		},
		{
			Name:   "4. Filtered Search ('inverter' + Gauteng)",
			Method: "GET",
			Path:   "/search?q=inverter&province=Gauteng",
		},
		{
			Name:   "5. Malls Directory (3,315 Malls)",
			Method: "GET",
			Path:   "/malls",
		},
		{
			Name:   "6. Live Consumer Chat Desk",
			Method: "GET",
			Path:   "/chat",
		},
		{
			Name:        "7. AI Assistant Solar Sizing Tool",
			Method:      "POST",
			Path:        "/api/assistant",
			Body:        []byte(`{"message":"calculate backup for 800W load for 4 hours"}`),
			ContentType: "application/json",
		},
	}

	fmt.Println("==========================================================================================")
	fmt.Println("⚡ SHOPPAGE PURE GO BENCHMARK & LATENCY AUDIT")
	fmt.Printf("   Target: %s | Warmup: 50 reqs | Load: 250 requests per endpoint | Concurrency: 15 workers\n", baseURL)
	fmt.Println("==========================================================================================")

	client := &http.Client{
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 100,
			IdleConnTimeout:     90 * time.Second,
		},
		Timeout: 10 * time.Second,
	}

	var results []BenchResult

	for _, rt := range routes {
		res := benchmarkRoute(client, baseURL, rt, 250, 15)
		results = append(results, res)
	}

	// Print Results Table
	fmt.Printf("\n%-36s | %8s | %10s | %10s | %10s | %10s | %10s\n", "Endpoint / Feature", "RPS", "Min", "P50 (Med)", "P90", "P99", "Mean")
	fmt.Println("-------------------------------------+----------+------------+------------+------------+------------+-----------")

	for _, r := range results {
		fmt.Printf("%-36s | %8.0f | %10s | %10s | %10s | %10s | %10s\n",
			r.Name,
			r.RPS,
			formatDuration(r.Min),
			formatDuration(r.P50),
			formatDuration(r.P90),
			formatDuration(r.P99),
			formatDuration(r.Mean),
		)
	}
	fmt.Println("==========================================================================================")
}

func benchmarkRoute(client *http.Client, base string, rt RouteBenchmark, total int, concurrency int) BenchResult {
	url := base + rt.Path

	// Warmup 20 requests
	for i := 0; i < 20; i++ {
		var bodyReader io.Reader
		if len(rt.Body) > 0 {
			bodyReader = bytes.NewReader(rt.Body)
		}
		req, _ := http.NewRequest(rt.Method, url, bodyReader)
		if rt.ContentType != "" {
			req.Header.Set("Content-Type", rt.ContentType)
		}
		if r, err := client.Do(req); err == nil {
			_, _ = io.Copy(io.Discard, r.Body)
			_ = r.Body.Close()
		}
	}

	latencies := make([]time.Duration, total)
	var mu sync.Mutex
	idx := 0
	successCount := 0

	var wg sync.WaitGroup
	startAll := time.Now()

	reqPerWorker := total / concurrency
	remainder := total % concurrency

	for w := 0; w < concurrency; w++ {
		count := reqPerWorker
		if w == 0 {
			count += remainder
		}

		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			for i := 0; i < n; i++ {
				var bodyReader io.Reader
				if len(rt.Body) > 0 {
					bodyReader = bytes.NewReader(rt.Body)
				}
				req, _ := http.NewRequest(rt.Method, url, bodyReader)
				if rt.ContentType != "" {
					req.Header.Set("Content-Type", rt.ContentType)
				}

				t0 := time.Now()
				resp, err := client.Do(req)
				dur := time.Since(t0)

				if err == nil {
					_, _ = io.Copy(io.Discard, resp.Body)
					_ = resp.Body.Close()
					if resp.StatusCode >= 200 && resp.StatusCode < 400 {
						mu.Lock()
						latencies[idx] = dur
						idx++
						successCount++
						mu.Unlock()
						continue
					}
				}
				mu.Lock()
				latencies[idx] = dur
				idx++
				mu.Unlock()
			}
		}(count)
	}

	wg.Wait()
	totalDuration := time.Since(startAll)

	sort.Slice(latencies, func(i, j int) bool {
		return latencies[i] < latencies[j]
	})

	var sum time.Duration
	for _, d := range latencies {
		sum += d
	}
	mean := sum / time.Duration(len(latencies))

	p50 := latencies[int(float64(len(latencies))*0.50)]
	p90 := latencies[int(float64(len(latencies))*0.90)]
	p99 := latencies[int(float64(len(latencies))*0.99)]

	rps := float64(total) / totalDuration.Seconds()

	return BenchResult{
		Name:        rt.Name,
		TotalReqs:   total,
		SuccessReqs: successCount,
		RPS:         rps,
		Min:         latencies[0],
		Max:         latencies[len(latencies)-1],
		Mean:        mean,
		P50:         p50,
		P90:         p90,
		P99:         p99,
	}
}

func formatDuration(d time.Duration) string {
	if d < time.Millisecond {
		return fmt.Sprintf("%.2fµs", float64(d.Nanoseconds())/1000.0)
	}
	return fmt.Sprintf("%.2fms", float64(d.Microseconds())/1000.0)
}
