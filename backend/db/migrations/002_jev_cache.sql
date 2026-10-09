ALTER TABLE jev_runs
  DROP CONSTRAINT jev_runs_primitive_check;

ALTER TABLE jev_runs
  ADD CONSTRAINT jev_runs_primitive_check
  CHECK (primitive IN ('noul', 'score', 'choice', 'mixed'));

ALTER TABLE jev_runs
  ADD COLUMN model_requested text NOT NULL DEFAULT 'jev-latest',
  ADD COLUMN response jsonb;

ALTER TABLE jev_runs
  DROP CONSTRAINT jev_runs_input_hash_model_rubric_version_primitive_key;

ALTER TABLE jev_runs
  ADD CONSTRAINT jev_runs_cache_key_unique
  UNIQUE (input_hash, model_requested, rubric_version, primitive);
