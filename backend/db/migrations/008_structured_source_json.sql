-- Older bulk inserts encoded structured objects twice. Preserve identities and hashes.
UPDATE source_records SET payload = (payload #>> '{}')::jsonb
 WHERE jsonb_typeof(payload) = 'string' AND left(ltrim(payload #>> '{}'), 1) = '{';
UPDATE nodes SET properties = (properties #>> '{}')::jsonb
 WHERE jsonb_typeof(properties) = 'string' AND left(ltrim(properties #>> '{}'), 1) = '{';
UPDATE node_facts SET value = (value #>> '{}')::jsonb
 WHERE jsonb_typeof(value) = 'string' AND left(ltrim(value #>> '{}'), 1) = '{';

CREATE INDEX source_records_account_idx ON source_records (source_id, (payload->>'account_id'), record_number);
