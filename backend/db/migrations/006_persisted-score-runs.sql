ALTER TABLE account_factors
  ADD COLUMN score_run_id text REFERENCES score_runs(id);

CREATE INDEX account_factors_score_run_idx ON account_factors (score_run_id, account_node_id, factor);

CREATE TABLE score_run_results (
  id text PRIMARY KEY,
  score_run_id text NOT NULL REFERENCES score_runs(id),
  account_node_id text NOT NULL REFERENCES nodes(id),
  score numeric(5, 2) CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  status text NOT NULL CHECK (status IN ('complete', 'partial', 'unscored')),
  coverage numeric(5, 2) NOT NULL CHECK (coverage BETWEEN 0 AND 100),
  level text,
  level_reason text NOT NULL,
  annual_value_idr numeric(16, 2) CHECK (annual_value_idr IS NULL OR annual_value_idr >= 0),
  weighted_value_idr numeric(16, 2) CHECK (weighted_value_idr IS NULL OR weighted_value_idr >= 0),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (score_run_id, account_node_id),
  CHECK ((status = 'unscored') = (score IS NULL))
);
CREATE INDEX score_run_results_rank_idx ON score_run_results (score_run_id, score DESC NULLS LAST, account_node_id);

GRANT INSERT ON score_run_results TO tessera_runtime;
