DO $$ BEGIN
  CREATE ROLE tessera_migrator NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE ROLE tessera_runtime NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT USAGE ON SCHEMA public TO tessera_migrator, tessera_runtime;
GRANT CREATE ON SCHEMA public TO tessera_migrator;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tessera_migrator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO tessera_runtime;
GRANT INSERT ON decisions, signal_reviews, signals, jev_runs, account_factors, score_runs,
  plans, plan_revisions, feedback, feedback_replies TO tessera_runtime;
GRANT UPDATE (status) ON feedback TO tessera_runtime;
GRANT UPDATE (status) ON signals TO tessera_runtime;
GRANT UPDATE (model, status, latency_ms, input_tokens, output_tokens, error_code, response, created_at)
  ON jev_runs TO tessera_runtime;
REVOKE UPDATE, DELETE ON decisions FROM tessera_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tessera_migrator;

ALTER DEFAULT PRIVILEGES FOR ROLE tessera_migrator IN SCHEMA public
  GRANT SELECT ON TABLES TO tessera_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE tessera_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO tessera_runtime;
