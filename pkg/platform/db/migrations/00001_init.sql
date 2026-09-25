-- +goose Up
-- Merchant OS workspace state, one document per tenant (store). Version is
-- bumped on every save so concurrent writers can be detected later.
CREATE TABLE merchant_workspaces (
    tenant_id  TEXT PRIMARY KEY,
    state      JSONB       NOT NULL,
    version    BIGINT      NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consumer-side records created by buyers and suppliers (orders, supplier
-- registrations, feed posts, storefront reviews). kind + id is the identity;
-- created_at preserves insertion order for replay on startup.
CREATE TABLE consumer_records (
    kind       TEXT        NOT NULL,
    id         TEXT        NOT NULL,
    doc        JSONB       NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (kind, id)
);
CREATE INDEX consumer_records_kind_created_idx ON consumer_records (kind, created_at);

-- +goose Down
DROP TABLE consumer_records;
DROP TABLE merchant_workspaces;
