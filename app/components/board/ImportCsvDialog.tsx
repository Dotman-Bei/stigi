import { useRef, useState } from "react";

export interface ImportCsvDialogProps {
  open: boolean;
  onClose: () => void;
  /** Resolves true when the import succeeded (the caller shows any error toast). */
  onImport: (csv: string) => Promise<boolean>;
}

export function ImportCsvDialog({ open, onClose, onImport }: ImportCsvDialogProps) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!open) return null;

  async function submit(csv: string): Promise<void> {
    if (csv.trim().length === 0) return;
    setBusy(true);
    const ok = await onImport(csv);
    setBusy(false);
    if (ok) {
      setText("");
      onClose();
    }
  }

  return (
    <div className="stigi-dialog-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="stigi-dialog" role="dialog" aria-modal="true" aria-labelledby="stigi-import-title">
        <h2 id="stigi-import-title">Import feedback from CSV</h2>
        <p className="stigi-meta">
          One comment per row. A column named comment, feedback, text, body, note or message is used; otherwise the first
          column. A board holds up to 500 notes.
        </p>
        <button type="button" className="stigi-btn stigi-btn--secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
          Choose a CSV file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="stigi-sr-only"
          aria-label="CSV file"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await submit(await file.text());
            e.target.value = "";
          }}
        />
        <textarea aria-label="Paste CSV" value={text} onChange={(e) => setText(e.target.value)}
          placeholder={"comment\nThe export is slow\nLove the receipt scanner"} />
        <div className="stigi-report__actions">
          <button type="button" className="stigi-btn stigi-btn--primary" disabled={busy || text.trim().length === 0}
            onClick={() => void submit(text)}>
            Import pasted CSV
          </button>
          <button type="button" className="stigi-btn stigi-btn--secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
