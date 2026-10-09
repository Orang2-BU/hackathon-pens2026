GRANT SELECT ON ALL TABLES IN SCHEMA public TO tessera_runtime;
GRANT INSERT ON decisions, signal_reviews, signals, jev_runs, account_factors, score_runs,
  plans, plan_revisions, feedback, feedback_replies TO tessera_runtime;
GRANT UPDATE (status) ON feedback TO tessera_runtime;
GRANT UPDATE (status) ON signals TO tessera_runtime;
GRANT UPDATE (model, status, latency_ms, input_tokens, output_tokens, error_code, response, created_at)
  ON jev_runs TO tessera_runtime;
REVOKE UPDATE, DELETE ON decisions FROM tessera_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE tessera_migrator IN SCHEMA public
  GRANT SELECT ON TABLES TO tessera_runtime;
