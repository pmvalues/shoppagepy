package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"sort"
	"strings"
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
	if len(os.Args) > 1 && os.Args[1] != "" {
		baseURL = strings.TrimRight(os.Args[1], "/")
	} else if envTarget := os.Getenv("TARGET_URL"); envTarget != "" {
		baseURL = strings.TrimRight(envTarget, "/")
	}

	// Verify server is reachable
	client := &http.Client{
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 100,
			IdleConnTimeout:     90 * time.Second,
		},
		Timeout: 15 * time.Second,
	}

	resp, err := client.Get(baseURL + "/health")
	if err != nil || resp.StatusCode != http.StatusOK {
		fmt.Printf("❌ Error: Target server is unreachable at %s\n", baseURL)
		if err != nil {
			fmt.Printf("   Details: %v\n", err)
		}
		return
	}
	_ = resp.Body.Close()

	isRemote := strings.HasPrefix(baseURL, "https://")
	reqCount := 200
	concurrency := 15
	warmup := 15

	if isRemote {
		reqCount = 60
		concurrency = 8
		warmup = 5
	}

	routes := []RouteBenchmark{
		{
			Name:   "1. Health API",
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
			Name:        "7. AI Solar Sizing Assistant",
			Method:      "POST",
			Path:        "/api/assistant",
			Body:        []byte(`{"message":"calculate backup for 800W load for 4 hours"}`),
			ContentType: "application/json",
		},
	}

	fmt.Println("==========================================================================================")
	fmt.Println("⚡ SHOPPAGE LIVE SPEED TEST & LATENCY AUDIT")
	fmt.Printf("   Target: %s\n", baseURL)
	fmt.Printf("   Config: %d requests per route | %d concurrent connections | %d warmup\n", reqCount, concurrency, warmup)
	fmt.Println("==========================================================================================")
	fmt.Printf("%-36s | %8s | %10s | %10s | %10s | %10s | %10s\n", "Endpoint / Feature", "RPS", "Min", "P50 (Med)", "P90", "P99", "Mean")
	fmt.Println("-------------------------------------+----------+------------+------------+------------+------------+-----------")

	for _, rt := range routes {
		res := benchmarkRoute(client, baseURL, rt, reqCount, concurrency, warmup)
		fmt.Printf("%-36s | %8.1f | %10s | %10s | %10s | %10s | %10s\n",
			res.Name,
			res.RPS,
			formatDuration(res.Min),
			formatDuration(res.P50),
			formatDuration(res.P90),
			formatDuration(res.P99),
			formatDuration(res.Mean),
		)
	}
	fmt.Println("==========================================================================================")
}

func benchmarkRoute(client *http.Client, base string, rt RouteBenchmark, total int, concurrency int, warmup int) BenchResult {
	url := base + rt.Path

	// Warmup
	for i := 0; i < warmup; i++ {
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

	latencies := make([]time.Duration, 0, total)
	var mu sync.Mutex
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

				mu.Lock()
				latencies = append(latencies, dur)
				if err == nil {
					_, _ = io.Copy(io.Discard, resp.Body)
					_ = resp.Body.Close()
					if resp.StatusCode >= 200 && resp.StatusCode < 400 {
						successCount++
					}
				}
				mu.Unlock()
			}
		}(count)
	}

	wg.Wait()
	totalDuration := time.Since(startAll)

	if len(latencies) == 0 {
		return BenchResult{Name: rt.Name}
	}

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

	rps := float64(len(latencies)) / totalDuration.Seconds()

	return BenchResult{
		Name:        rt.Name,
		TotalReqs:   len(latencies),
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
