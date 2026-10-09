ALTER TABLE signal_reviews
  ADD COLUMN idempotency_key text,
  ADD COLUMN payload_hash text;

UPDATE signal_reviews
SET idempotency_key = id,
    payload_hash = repeat('0', 64)
WHERE idempotency_key IS NULL OR payload_hash IS NULL;

ALTER TABLE signal_reviews
  ALTER COLUMN idempotency_key SET NOT NULL,
  ALTER COLUMN payload_hash SET NOT NULL;

ALTER TABLE signal_reviews
  ADD CONSTRAINT signal_reviews_payload_hash_check CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT signal_reviews_actor_idempotency_unique UNIQUE (actor_id, idempotency_key);
