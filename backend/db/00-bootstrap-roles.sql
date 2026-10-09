CREATE ROLE tessera_migrator NOLOGIN;
CREATE ROLE tessera_runtime NOLOGIN;
SELECT format('CREATE ROLE tessera_migrator_login LOGIN PASSWORD %L', :'migrator_password') \gexec
SELECT format('CREATE ROLE tessera_runtime_login LOGIN PASSWORD %L', :'runtime_password') \gexec
GRANT tessera_migrator TO tessera_migrator_login;
GRANT tessera_runtime TO tessera_runtime_login;
GRANT USAGE, CREATE ON SCHEMA public TO tessera_migrator;
GRANT USAGE ON SCHEMA public TO tessera_runtime;
