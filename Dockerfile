# ==============================================================================
# Shoppage 100% Pure Go Platform Multi-Stage Container
# ==============================================================================

FROM golang:1.25-alpine AS builder

WORKDIR /app
RUN apk add --no-cache git ca-certificates

# Copy Go workspace and module manifests
COPY go.work go.work.sum* ./
COPY services/ ./services/

# Compile all static Go binaries (CGO-free, stripped for ultra-small size)
RUN cd services/consumer-web && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/shoppage-consumer ./cmd/server/main.go
RUN cd services/merchant-os && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/shoppage-merchant ./cmd/server/main.go
RUN cd services/chat-gateway && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/shoppage-chat ./cmd/server/main.go
RUN cd services/search-core && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/shoppage-search ./cmd/searchd/main.go

# ------------------------------------------------------------------------------
# Target: consumer-web (Frontend Gateway, PWA, AI Assistant)
# ------------------------------------------------------------------------------
FROM alpine:3.20 AS consumer-web
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /bin/shoppage-consumer /app/shoppage
COPY services/consumer-web/data/ /app/data/
COPY shoppage-commerce-intelligence-foundation/ /app/shoppage-commerce-intelligence-foundation/
ENV PORT=3000
EXPOSE 3000
CMD ["/app/shoppage"]

# ------------------------------------------------------------------------------
# Target: merchant-os (Merchant Dashboard & Operations)
# ------------------------------------------------------------------------------
FROM alpine:3.20 AS merchant-os
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /bin/shoppage-merchant /app/shoppage
ENV PORT=8083
EXPOSE 8083
CMD ["/app/shoppage"]

# ------------------------------------------------------------------------------
# Target: chat-gateway (WebSocket & Real-Time Hub)
# ------------------------------------------------------------------------------
FROM alpine:3.20 AS chat-gateway
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /bin/shoppage-chat /app/shoppage
ENV PORT=8080
EXPOSE 8080
CMD ["/app/shoppage"]

# ------------------------------------------------------------------------------
# Target: search-core (Fast SQLite Search Engine)
# ------------------------------------------------------------------------------
FROM alpine:3.20 AS search-core
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /bin/shoppage-search /app/shoppage
ENV PORT=8082
EXPOSE 8082
CMD ["/app/shoppage"]

# ------------------------------------------------------------------------------
# Target: all-in-one (Default - Single Container Running All 4 Services)
# ------------------------------------------------------------------------------
FROM alpine:3.20 AS all-in-one
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /bin/shoppage-consumer /app/shoppage-consumer
COPY --from=builder /bin/shoppage-merchant /app/shoppage-merchant
COPY --from=builder /bin/shoppage-chat /app/shoppage-chat
COPY --from=builder /bin/shoppage-search /app/shoppage-search

COPY data/ /app/data/
COPY services/consumer-web/data/ /app/data/
COPY shoppage-commerce-intelligence-foundation/ /app/shoppage-commerce-intelligence-foundation/

RUN printf '#!/bin/sh\n/app/shoppage-chat &\n/app/shoppage-search &\n/app/shoppage-merchant &\nexec /app/shoppage-consumer\n' > /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

ENV PORT=3000
EXPOSE 3000 8080 8082 8083
CMD ["/app/entrypoint.sh"]
