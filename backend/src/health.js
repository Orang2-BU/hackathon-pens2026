export async function getReadiness(database) {
  try {
    const [migration] = await database`
      SELECT version
      FROM schema_migrations
      ORDER BY version DESC
      LIMIT 1
    `;
    const [revision] = await database`
      SELECT id
      FROM dataset_revisions
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 1
    `;

    return {
      ready: Boolean(migration && revision),
      database: 'available',
      schemaVersion: migration?.version ?? null,
      datasetRevision: revision?.id ?? null,
    };
  } catch {
    return {
      ready: false,
      database: 'unavailable',
      schemaVersion: null,
      datasetRevision: null,
    };
  }
}
