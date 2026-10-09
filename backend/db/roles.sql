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
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tessera_runtime;
REVOKE UPDATE, DELETE ON decisions FROM tessera_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tessera_migrator, tessera_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE tessera_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tessera_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE tessera_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO tessera_runtime;
