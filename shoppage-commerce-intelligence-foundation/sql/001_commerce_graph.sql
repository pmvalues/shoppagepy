CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE verification_state AS ENUM ('unverified','claimed','evidence_pending','verified','disputed','rejected');
CREATE TYPE review_state AS ENUM ('pending','approved','rejected','needs_more_evidence','superseded');

CREATE TABLE source_system (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text UNIQUE NOT NULL,
  name text NOT NULL,
  source_type text NOT NULL,
  authority_scope text,
  rights_basis text,
  base_url text,
  refresh_expectation interval,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE source_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system_id uuid NOT NULL REFERENCES source_system(id),
  external_id text,
  source_url text,
  observed_at timestamptz NOT NULL,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  content_sha256 text NOT NULL,
  raw_payload jsonb,
  rights_note text,
  UNIQUE(source_system_id, external_id, content_sha256)
);

CREATE TABLE organisation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name citext NOT NULL,
  organisation_type text NOT NULL,
  legal_status text,
  lifecycle_status text NOT NULL DEFAULT 'candidate',
  verification verification_state NOT NULL DEFAULT 'unverified',
  established_on date,
  dissolved_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organisation_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisation(id),
  name citext NOT NULL,
  name_type text NOT NULL,
  language_code text,
  valid_from date,
  valid_to date,
  source_record_id uuid REFERENCES source_record(id)
);
CREATE INDEX organisation_name_normalized_idx ON organisation_name (lower(name::text));

CREATE TABLE activity_code (
  scheme text NOT NULL,
  version text NOT NULL,
  code text NOT NULL,
  title text NOT NULL,
  parent_code text,
  level text,
  PRIMARY KEY (scheme, version, code)
);

CREATE TABLE organisation_activity (
  organisation_id uuid NOT NULL REFERENCES organisation(id),
  scheme text NOT NULL,
  version text NOT NULL,
  code text NOT NULL,
  activity_role text NOT NULL DEFAULT 'secondary',
  valid_from date,
  valid_to date,
  confidence numeric(5,4) CHECK (confidence BETWEEN 0 AND 1),
  source_record_id uuid REFERENCES source_record(id),
  PRIMARY KEY (organisation_id, scheme, version, code, activity_role, valid_from),
  FOREIGN KEY (scheme, version, code) REFERENCES activity_code(scheme, version, code)
);

CREATE TABLE place (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name citext NOT NULL,
  place_type text NOT NULL,
  country_code char(2) NOT NULL DEFAULT 'ZW',
  parent_place_id uuid REFERENCES place(id),
  latitude numeric(10,7),
  longitude numeric(10,7),
  boundary_geojson jsonb,
  external_ids jsonb NOT NULL DEFAULT '{}'::jsonb,
  hierarchy_confidence numeric(5,4) CHECK (hierarchy_confidence BETWEEN 0 AND 1),
  verification verification_state NOT NULL DEFAULT 'unverified',
  valid_from date,
  valid_to date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX place_parent_idx ON place(parent_place_id);
CREATE INDEX place_type_idx ON place(place_type);

CREATE TABLE market (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL UNIQUE REFERENCES place(id),
  parent_market_id uuid REFERENCES market(id),
  market_type text NOT NULL,
  operator_organisation_id uuid REFERENCES organisation(id),
  effective_from date,
  effective_to date,
  verification verification_state NOT NULL DEFAULT 'unverified'
);

CREATE TABLE commercial_location (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisation(id),
  place_id uuid REFERENCES place(id),
  location_type text NOT NULL,
  name citext,
  address_text text,
  hours jsonb,
  contacts jsonb,
  payment_methods text[],
  service_area_geojson jsonb,
  verification verification_state NOT NULL DEFAULT 'unverified',
  valid_from date,
  valid_to date
);

CREATE TABLE category_node (
  scheme text NOT NULL,
  version text NOT NULL,
  code text NOT NULL,
  title text NOT NULL,
  definition text,
  parent_code text,
  level text,
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY(scheme, version, code)
);

CREATE TABLE category_mapping (
  from_scheme text NOT NULL,
  from_version text NOT NULL,
  from_code text NOT NULL,
  to_scheme text NOT NULL,
  to_version text NOT NULL,
  to_code text NOT NULL,
  mapping_relation text NOT NULL,
  confidence numeric(5,4) CHECK (confidence BETWEEN 0 AND 1),
  review review_state NOT NULL DEFAULT 'pending',
  source_record_id uuid REFERENCES source_record(id),
  PRIMARY KEY(from_scheme, from_version, from_code, to_scheme, to_version, to_code)
);

CREATE TABLE attribute_definition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_key text UNIQUE NOT NULL,
  name text NOT NULL,
  data_type text NOT NULL,
  unit_dimension text,
  allowed_values jsonb,
  definition text,
  external_mappings jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE category_attribute (
  scheme text NOT NULL,
  version text NOT NULL,
  category_code text NOT NULL,
  attribute_id uuid NOT NULL REFERENCES attribute_definition(id),
  requirement text NOT NULL,
  display_order integer,
  validation_rule jsonb,
  PRIMARY KEY(scheme, version, category_code, attribute_id),
  FOREIGN KEY(scheme, version, category_code) REFERENCES category_node(scheme, version, code)
);

CREATE TABLE master_product (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_level text NOT NULL CHECK (product_level IN ('family','model','generic','service')),
  canonical_name citext NOT NULL,
  brand_organisation_id uuid REFERENCES organisation(id),
  primary_scheme text,
  primary_version text,
  primary_category_code text,
  verification verification_state NOT NULL DEFAULT 'unverified',
  lifecycle_status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(primary_scheme, primary_version, primary_category_code)
    REFERENCES category_node(scheme, version, code)
);

CREATE TABLE product_variant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_product_id uuid NOT NULL REFERENCES master_product(id),
  canonical_name citext NOT NULL,
  attribute_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  condition_scope text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_identifier (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_product_id uuid REFERENCES master_product(id),
  variant_id uuid REFERENCES product_variant(id),
  identifier_type text NOT NULL,
  identifier_value citext NOT NULL,
  issuer text,
  verification verification_state NOT NULL DEFAULT 'unverified',
  source_record_id uuid REFERENCES source_record(id),
  UNIQUE(identifier_type, identifier_value)
);

CREATE TABLE product_alias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_product_id uuid NOT NULL REFERENCES master_product(id),
  alias citext NOT NULL,
  language_code text,
  locality text,
  source_record_id uuid REFERENCES source_record(id)
);
CREATE INDEX product_alias_normalized_idx ON product_alias(lower(alias::text));

CREATE TABLE offer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisation(id),
  commercial_location_id uuid REFERENCES commercial_location(id),
  variant_id uuid REFERENCES product_variant(id),
  source_record_id uuid REFERENCES source_record(id),
  source_offer_key text,
  title text NOT NULL,
  currency char(3),
  price numeric(18,4),
  price_valid_until timestamptz,
  stock_state text,
  stock_confirmed_at timestamptz,
  lead_time jsonb,
  minimum_order numeric(18,4),
  terms jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX offer_variant_idx ON offer(variant_id);
CREATE INDEX offer_organisation_idx ON offer(organisation_id);

CREATE TABLE evidence_claim (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL,
  subject_id uuid NOT NULL,
  predicate text NOT NULL,
  object_value jsonb NOT NULL,
  source_record_id uuid NOT NULL REFERENCES source_record(id),
  asserted_by uuid,
  observed_at timestamptz NOT NULL,
  valid_from timestamptz,
  valid_to timestamptz,
  confidence numeric(5,4) CHECK (confidence BETWEEN 0 AND 1),
  verification verification_state NOT NULL DEFAULT 'unverified',
  review review_state NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX evidence_claim_subject_idx ON evidence_claim(subject_type, subject_id, predicate);

CREATE TABLE match_candidate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  left_external_key text NOT NULL,
  right_entity_id uuid,
  features jsonb NOT NULL,
  score numeric(5,4) NOT NULL CHECK (score BETWEEN 0 AND 1),
  proposed_action text NOT NULL,
  review review_state NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE coverage_cell (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES place(id),
  category_scheme text NOT NULL,
  category_version text NOT NULL,
  category_code text NOT NULL,
  verified_organisations integer NOT NULL DEFAULT 0,
  fresh_offers integer NOT NULL DEFAULT 0,
  variant_coverage numeric(8,4),
  response_rate numeric(8,4),
  verified_outcomes integer NOT NULL DEFAULT 0,
  coverage_state text NOT NULL DEFAULT 'empty',
  calculated_at timestamptz NOT NULL,
  FOREIGN KEY(category_scheme, category_version, category_code)
    REFERENCES category_node(scheme, version, code),
  UNIQUE(place_id, category_scheme, category_version, category_code, calculated_at)
);
