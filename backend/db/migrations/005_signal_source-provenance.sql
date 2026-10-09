ALTER TABLE signals
  ADD COLUMN source_record_id text REFERENCES source_records(id),
  ADD COLUMN source_hash text,
  ADD COLUMN source_field text;

ALTER TABLE signals
  ADD CONSTRAINT signals_source_hash_check CHECK (source_hash IS NULL OR source_hash ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT signals_source_field_check CHECK (source_field IS NULL OR source_field IN ('isi', 'deskripsi'));

CREATE INDEX signals_source_record_idx ON signals (source_record_id) WHERE source_record_id IS NOT NULL;
