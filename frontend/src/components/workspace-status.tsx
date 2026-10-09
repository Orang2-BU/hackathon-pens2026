export function WorkspaceStatus({ loading, error, refresh }: { loading: boolean; error?: string; refresh: () => void }) {
  if (error) return <section className="card" role="alert"><h2 className="card-title">Workspace unavailable</h2><p className="mt-sm text-body-sm text-on-surface-muted">{error}</p><button className="btn btn-secondary mt-md" onClick={refresh}>Retry</button></section>;
  if (loading) return <p className="card text-body-sm text-on-surface-muted" role="status">Loading from the workspace service…</p>;
  return null;
}
