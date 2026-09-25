# Shoppage developer tasks. Every Go module in go.work is covered.
MODULES := pkg/platform services/chat-gateway services/consumer-web services/merchant-os services/search-core services/sweeper-engine
PKGS    := $(addsuffix /...,$(addprefix ./,$(MODULES)))
TEMPL   := go run github.com/a-h/templ/cmd/templ@v0.3.1020

.PHONY: dev test test-db vet fmt fmt-check vuln templ templ-check css build check

## dev: run the whole platform locally (in-memory unless DATABASE_URL is set)
dev:
	SHOPPAGE_ENV=development go run ./services/consumer-web/cmd/server

## test: unit tests for every module
test:
	SHOPPAGE_ENV=test go test -race $(PKGS)

## test-db: also run PostgreSQL integration tests (needs TEST_DATABASE_URL)
test-db:
	@test -n "$(TEST_DATABASE_URL)" || (echo "set TEST_DATABASE_URL=postgres://..." && exit 1)
	SHOPPAGE_ENV=test go test -race $(PKGS)

vet:
	go vet $(PKGS)

fmt:
	gofmt -w pkg services

fmt-check:
	@out="$$(gofmt -l pkg services)"; if [ -n "$$out" ]; then echo "gofmt needed:"; echo "$$out"; exit 1; fi

## vuln: known-vulnerability scan (Go vulnerability database)
vuln:
	@for m in $(MODULES); do echo "== $$m"; (cd $$m && go run golang.org/x/vuln/cmd/govulncheck@latest ./...) || exit 1; done

## templ: regenerate *_templ.go from *.templ
templ:
	cd services/consumer-web && $(TEMPL) generate
	cd services/merchant-os && $(TEMPL) generate

## templ-check: fail if committed *_templ.go files are stale
templ-check: templ
	@git diff --exit-code -- '*_templ.go' || (echo "Generated templ files are stale: run 'make templ' and commit." && exit 1)

css:
	npx @tailwindcss/cli -i ./services/consumer-web/static/css/input.css -o ./services/consumer-web/internal/assets/css/tailwind.min.css --minify

## build: static Linux binary of the single-binary platform
build:
	CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o bin/shoppage ./services/consumer-web/cmd/server

## check: everything CI runs, except the database and vulnerability jobs
check: fmt-check vet test templ-check
