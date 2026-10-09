CREATE TABLE actions (
 id text PRIMARY KEY,
 decision_id text NOT NULL UNIQUE REFERENCES decisions(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE action_events (
 id text PRIMARY KEY,
 action_id text NOT NULL REFERENCES actions(id),
 revision integer NOT NULL CHECK (revision > 0),
 actor_id text NOT NULL,
 owner text NOT NULL CHECK (length(owner) BETWEEN 1 AND 120),
 due_date date NOT NULL,
 status text NOT NULL CHECK (status IN ('planned','in_progress','blocked','completed','cancelled')),
 note text NOT NULL CHECK (length(note) BETWEEN 1 AND 4000),
 outcome text CHECK (length(outcome) BETWEEN 1 AND 4000),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(action_id, revision),
 CHECK (status <> 'completed' OR outcome IS NOT NULL)
);
CREATE TRIGGER action_events_append_only BEFORE UPDATE OR DELETE ON action_events
 FOR EACH ROW EXECUTE FUNCTION reject_decision_mutation();
GRANT SELECT, INSERT ON actions, action_events TO tessera_runtime;
REVOKE UPDATE, DELETE ON action_events FROM tessera_runtime;
