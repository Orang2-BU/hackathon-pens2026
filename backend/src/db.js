import postgres from 'postgres';

export function createDatabase(url, options = {}) {
  if (typeof url !== 'string' || !url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
    throw new Error('A PostgreSQL DATABASE_URL is required.');
  }

  return postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 5,
    ...options,
  });
}
