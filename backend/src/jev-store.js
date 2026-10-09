export function createJevRunStore(database) {
  return {
    async getCached({ inputHash, modelRequested, rubricVersion, primitive }) {
      const [row] = await database`
        SELECT model, response, latency_ms, input_tokens, output_tokens
        FROM jev_runs
        WHERE input_hash = ${inputHash}
          AND model_requested = ${modelRequested}
          AND rubric_version = ${rubricVersion}
          AND primitive = ${primitive}
          AND status = 'succeeded'
          AND response IS NOT NULL
        LIMIT 1
      `;
      return row ?? null;
    },

    async saveRun(run) {
      await database`
        INSERT INTO jev_runs (
          id, input_hash, primitive, model, model_requested, rubric_version, status,
          latency_ms, input_tokens, output_tokens, error_code, response
        ) VALUES (
          ${run.id}, ${run.inputHash}, ${run.primitive}, ${run.model}, ${run.modelRequested},
          ${run.rubricVersion}, ${run.status}, ${run.latencyMs}, ${run.inputTokens},
          ${run.outputTokens}, ${run.errorCode}, ${database.json(run.response)}
        )
        ON CONFLICT (input_hash, model_requested, rubric_version, primitive)
        DO UPDATE SET
          model = EXCLUDED.model,
          status = EXCLUDED.status,
          latency_ms = EXCLUDED.latency_ms,
          input_tokens = EXCLUDED.input_tokens,
          output_tokens = EXCLUDED.output_tokens,
          error_code = EXCLUDED.error_code,
          response = EXCLUDED.response,
          created_at = now()
        WHERE jev_runs.status <> 'succeeded' OR EXCLUDED.status = 'succeeded'
      `;
    },
  };
}
