module github.com/shoppage/search-core

go 1.27.1

require (
	github.com/go-chi/chi/v5 v5.3.2
	github.com/go-chi/cors v1.2.2
	github.com/shoppage/platform v0.0.0
)

require (
	github.com/VictoriaMetrics/metrics v1.44.0 // indirect
	github.com/getsentry/sentry-go v0.49.0 // indirect
	github.com/go-chi/httprate v0.16.0 // indirect
	github.com/klauspost/cpuid/v2 v2.2.10 // indirect
	github.com/valyala/fastrand v1.1.0 // indirect
	github.com/valyala/histogram v1.2.0 // indirect
	github.com/zeebo/xxh3 v1.0.2 // indirect
	golang.org/x/sys v0.47.0 // indirect
	golang.org/x/text v0.41.0 // indirect
)

replace github.com/shoppage/platform => ../../pkg/platform
