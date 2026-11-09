export interface EmptyBoardProps {
  loading: boolean;
  onLoadSample: () => void;
  onImportCsv: (() => void) | null;
}

export function EmptyBoard({ loading, onLoadSample, onImportCsv }: EmptyBoardProps) {
  return (
    <section className="stigi-empty" aria-labelledby="stigi-empty-title">
      <h2 id="stigi-empty-title" className="stigi-empty__title">Sort customer feedback with an agent</h2>
      <p className="stigi-empty__line">
        Load 200 synthetic sample comments for a fictional expenses app, already roughly sorted. Drag two notes into a
        new cluster to teach the agent a theme.
      </p>
      <button type="button" className="stigi-btn stigi-btn--primary" onClick={onLoadSample} disabled={loading}>
        {loading ? "Loading sample…" : "Load sample data (200 notes)"}
      </button>
      {onImportCsv ? (
        <button type="button" className="stigi-link" onClick={onImportCsv}>or import your own CSV</button>
      ) : null}
    </section>
  );
}
