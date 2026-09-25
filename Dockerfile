# syntax=docker/dockerfile:1
# ==============================================================================
# Shoppage platform image
#
# Default target: one static binary that serves the consumer site and mounts
# Merchant OS, the chat gateway and the search core in-process. The per-service
# targets exist only for split deployments (see docs/DEPLOYMENT.md).
# ==============================================================================

FROM golang:1.27.1-alpine3.24 AS builder
WORKDIR /src
RUN apk add --no-cache ca-certificates git

COPY go.work go.work.sum ./
COPY pkg/ ./pkg/
COPY services/ ./services/

ARG SHOPPAGE_RELEASE=dev
ENV CGO_ENABLED=0 GOOS=linux
RUN go build -trimpath -ldflags="-s -w" -o /out/shoppage ./services/consumer-web/cmd/server \
 && go build -trimpath -ldflags="-s -w" -o /out/shoppage-merchant ./services/merchant-os/cmd/server \
 && go build -trimpath -ldflags="-s -w" -o /out/shoppage-chat ./services/chat-gateway/cmd/server \
 && go build -trimpath -ldflags="-s -w" -o /out/shoppage-search ./services/search-core/cmd/searchd

# ------------------------------------------------------------------------------
# Shared runtime: non-root user, CA roots and zoneinfo, writable /app/state.
# ------------------------------------------------------------------------------
FROM alpine:3.24 AS runtime
RUN apk add --no-cache ca-certificates tzdata \
 && addgroup -S shoppage && adduser -S -G shoppage -H -h /app shoppage \
 && mkdir -p /app/state && chown shoppage:shoppage /app/state
WORKDIR /app
ENV SHOPPAGE_ENV=production \
    CHAT_DB_PATH=/app/state/chat-gateway.db \
    MERCHANT_DATA_DIR=/app/state/merchant
USER shoppage

# ------------------------------------------------------------------------------
# Split-deployment targets (optional)
# ------------------------------------------------------------------------------
FROM runtime AS merchant-os
COPY --from=builder /out/shoppage-merchant /app/shoppage
EXPOSE 8083
CMD ["/app/shoppage"]

FROM runtime AS chat-gateway
COPY --from=builder /out/shoppage-chat /app/shoppage
EXPOSE 8080
CMD ["/app/shoppage"]

FROM runtime AS search-core
COPY --from=builder /out/shoppage-search /app/shoppage
EXPOSE 8082
CMD ["/app/shoppage"]

# ------------------------------------------------------------------------------
# Default target: the single-binary platform
# ------------------------------------------------------------------------------
FROM runtime AS shoppage
ARG SHOPPAGE_RELEASE=dev
ENV SHOPPAGE_RELEASE=${SHOPPAGE_RELEASE} PORT=3000 DATA_DIR=/app/data
COPY --from=builder /out/shoppage /app/shoppage
COPY services/consumer-web/data/ /app/data/
# Bulk *.sqlite reference datasets are not in git or the image; mount them
# read-only and point FOUNDATION_DATA_DIR at the mount.
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:3000/healthz || exit 1
CMD ["/app/shoppage"]
