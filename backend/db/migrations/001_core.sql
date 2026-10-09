CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dataset_revisions (
  id text PRIMARY KEY,
  source_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('staging', 'published', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CHECK ((status = 'published') = (published_at IS NOT NULL))
);

CREATE TABLE ingest_runs (
  id text PRIMARY KEY,
  dataset_revision_id text NOT NULL REFERENCES dataset_revisions(id),
  status text NOT NULL CHECK (status IN ('running', 'published', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  report jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX ingest_runs_revision_idx ON ingest_runs (dataset_revision_id, started_at DESC);

CREATE TABLE sources (
  id text PRIMARY KEY,
  dataset_revision_id text NOT NULL REFERENCES dataset_revisions(id),
  file_name text NOT NULL,
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  row_count integer NOT NULL CHECK (row_count >= 0),
  synthetic boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dataset_revision_id, file_name)
);

CREATE TABLE source_records (
  id text PRIMARY KEY,
  source_id text NOT NULL REFERENCES sources(id),
  external_id text,
  record_number integer NOT NULL CHECK (record_number > 0),
  record_hash text NOT NULL CHECK (record_hash ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz,
  payload jsonb NOT NULL,
  UNIQUE (source_id, record_number)
);
CREATE INDEX source_records_external_idx ON source_records (source_id, external_id);

CREATE TABLE nodes (
  id text PRIMARY KEY,
  dataset_revision_id text NOT NULL REFERENCES dataset_revisions(id),
  type text NOT NULL,
  external_key text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  temporal_status text NOT NULL DEFAULT 'unknown_time'
    CHECK (temporal_status IN ('known', 'snapshot_only', 'unknown_time')),
  UNIQUE (dataset_revision_id, type, external_key)
);
CREATE INDEX nodes_type_key_idx ON nodes (type, external_key);

CREATE TABLE node_facts (
  id text PRIMARY KEY,
  node_id text NOT NULL REFERENCES nodes(id),
  key text NOT NULL,
  value jsonb,
  valid_from date,
  valid_to date,
  source_record_id text NOT NULL REFERENCES source_records(id),
  CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);
CREATE INDEX node_facts_node_key_idx ON node_facts (node_id, key, valid_from);

CREATE TABLE edges (
  id text PRIMARY KEY,
  dataset_revision_id text NOT NULL REFERENCES dataset_revisions(id),
  type text NOT NULL,
  source_node_id text NOT NULL REFERENCES nodes(id),
  target_node_id text NOT NULL REFERENCES nodes(id),
  relation_kind text NOT NULL CHECK (relation_kind IN ('hard', 'derived')),
  reason text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'review', 'rejected')),
  valid_from date,
  valid_to date,
  CHECK (source_node_id <> target_node_id),
  CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);
CREATE INDEX edges_source_type_idx ON edges (source_node_id, type);
CREATE INDEX edges_target_type_idx ON edges (target_node_id, type);

CREATE TABLE edge_sources (
  edge_id text NOT NULL REFERENCES edges(id),
  source_record_id text NOT NULL REFERENCES source_records(id),
  PRIMARY KEY (edge_id, source_record_id)
);

CREATE TABLE usage_daily (
  dataset_revision_id text NOT NULL REFERENCES dataset_revisions(id),
  date date NOT NULL,
  outlet_id text NOT NULL REFERENCES nodes(id),
  transactions integer CHECK (transactions IS NULL OR transactions >= 0),
  gross_sales_idr numeric(16, 2) CHECK (gross_sales_idr IS NULL OR gross_sales_idr >= 0),
  source_record_id text NOT NULL REFERENCES source_records(id),
  PRIMARY KEY (dataset_revision_id, date, outlet_id)
);
CREATE INDEX usage_daily_outlet_date_idx ON usage_daily (outlet_id, date);

CREATE TABLE jev_runs (
  id text PRIMARY KEY,
  input_hash text NOT NULL,
  primitive text NOT NULL CHECK (primitive IN ('noul', 'score')),
  model text NOT NULL,
  rubric_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('succeeded', 'failed')),
  latency_ms integer CHECK (latency_ms IS NULL OR latency_ms >= 0),
  input_tokens integer CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens integer CHECK (output_tokens IS NULL OR output_tokens >= 0),
  cost numeric(12, 6) CHECK (cost IS NULL OR cost >= 0),
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (input_hash, model, rubric_version, primitive)
);

CREATE TABLE signals (
  id text PRIMARY KEY,
  dataset_revision_id text NOT NULL REFERENCES dataset_revisions(id),
  node_id text NOT NULL REFERENCES nodes(id),
  jev_run_id text NOT NULL REFERENCES jev_runs(id),
  label text NOT NULL,
  probability numeric(5, 4) CHECK (probability IS NULL OR probability BETWEEN 0 AND 1),
  score numeric(8, 4),
  confidence numeric(5, 4) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quote text,
  span_start integer,
  span_end integer,
  status text NOT NULL CHECK (status IN ('active', 'review', 'discarded')),
  CHECK ((span_start IS NULL AND span_end IS NULL) OR
    (span_start >= 0 AND span_end > span_start))
);
CREATE INDEX signals_node_status_idx ON signals (node_id, status);

CREATE TABLE signal_reviews (
  id text PRIMARY KEY,
  signal_id text NOT NULL REFERENCES signals(id),
  actor_id text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('accepted', 'rejected')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE account_factors (
  id text PRIMARY KEY,
  dataset_revision_id text NOT NULL REFERENCES dataset_revisions(id),
  account_node_id text NOT NULL REFERENCES nodes(id),
  factor text NOT NULL,
  raw_value jsonb,
  normalized_value numeric(8, 4),
  unit text,
  status text NOT NULL CHECK (status IN ('available', 'partial', 'unavailable', 'excluded')),
  reason text,
  period_start date,
  period_end date,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  CHECK (period_end IS NULL OR period_start IS NULL OR period_end >= period_start),
  CHECK (status IN ('available', 'partial') OR normalized_value IS NULL)
);
CREATE INDEX account_factors_revision_account_idx ON account_factors (dataset_revision_id, account_node_id, factor);

CREATE TABLE score_runs (
  id text PRIMARY KEY,
  dataset_revision_id text NOT NULL REFERENCES dataset_revisions(id),
  formula_version text NOT NULL,
  parameters jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE plans (
  id text PRIMARY KEY,
  account_node_id text NOT NULL REFERENCES nodes(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE plan_revisions (
  id text PRIMARY KEY,
  plan_id text NOT NULL REFERENCES plans(id),
  revision integer NOT NULL CHECK (revision > 0),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 8000),
  actor_id text NOT NULL,
  context jsonb NOT NULL,
  evidence_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, revision)
);

CREATE TABLE decisions (
  id text PRIMARY KEY,
  plan_revision_id text NOT NULL REFERENCES plan_revisions(id),
  actor_id text NOT NULL,
  idempotency_key text NOT NULL,
  payload_hash text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('approved', 'rejected')),
  reason text,
  context jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (actor_id, idempotency_key)
);

CREATE FUNCTION reject_decision_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'decisions are append-only' USING ERRCODE = '55000';
END;
$$;
CREATE TRIGGER decisions_append_only
  BEFORE UPDATE OR DELETE ON decisions
  FOR EACH ROW EXECUTE FUNCTION reject_decision_mutation();

CREATE TABLE feedback (
  id text PRIMARY KEY,
  account_node_id text NOT NULL REFERENCES nodes(id),
  plan_revision_id text REFERENCES plan_revisions(id),
  actor_id text NOT NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'responded', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE feedback_replies (
  id text PRIMARY KEY,
  feedback_id text NOT NULL REFERENCES feedback(id),
  actor_id text NOT NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
