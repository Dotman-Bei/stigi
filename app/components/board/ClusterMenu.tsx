import { IconDots } from "@tabler/icons-react";
import { useState, type FormEvent } from "react";

export interface ClusterMenuProps {
  clusterName: string | null;
  agentDisabled: boolean;
  onMoreLikeThese: () => void;
  onRename: (name: string) => void;
  mergeTargets: { id: string; name: string }[];
  onMerge: ((targetClusterId: string) => void) | null;
  onDelete: (() => void) | null;
}

type Mode = "closed" | "open" | "rename" | "merge";

export function ClusterMenu(props: ClusterMenuProps) {
  const label = props.clusterName ?? "Untitled";
  const [mode, setMode] = useState<Mode>("closed");
  const [draft, setDraft] = useState(props.clusterName ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function close() {
    setMode("closed");
    setConfirmDelete(false);
  }

  function submitRename(event: FormEvent) {
    event.preventDefault();
    const name = draft.trim().slice(0, 60);
    if (name.length > 0) props.onRename(name);
    close();
  }

  if (mode === "rename") {
    return (
      <form className="stigi-rename" onSubmit={submitRename}>
        <input
          aria-label="Cluster name"
          value={draft}
          maxLength={60}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
        />
        <button type="submit" className="stigi-btn stigi-btn--primary">Save name</button>
      </form>
    );
  }

  return (
    <div className="stigi-menu">
      <button
        type="button"
        className="stigi-menu__toggle"
        aria-label={`Cluster actions for ${label}`}
        aria-expanded={mode !== "closed"}
        onClick={() => (mode === "closed" ? setMode("open") : close())}
      >
        <IconDots size={16} stroke={1.8} />
      </button>
      {mode === "open" ? (
        <div className="stigi-menu__panel">
          <button type="button" className="stigi-menu__item" disabled={props.agentDisabled}
            onClick={() => { close(); props.onMoreLikeThese(); }}>
            More like these
          </button>
          <button type="button" className="stigi-menu__item"
            onClick={() => { setDraft(props.clusterName ?? ""); setMode("rename"); }}>
            Rename
          </button>
          {props.onMerge && props.mergeTargets.length > 0 ? (
            <button type="button" className="stigi-menu__item" onClick={() => setMode("merge")}>
              Merge into…
            </button>
          ) : null}
          {props.onDelete ? (
            <button type="button" className="stigi-menu__item"
              onClick={() => {
                if (!confirmDelete) { setConfirmDelete(true); return; }
                close();
                props.onDelete?.();
              }}>
              {confirmDelete ? "Click again to delete" : "Delete cluster"}
            </button>
          ) : null}
        </div>
      ) : null}
      {mode === "merge" && props.onMerge ? (
        <div className="stigi-menu__panel">
          {props.mergeTargets.map((target) => (
            <button key={target.id} type="button" className="stigi-menu__item"
              aria-label={`Merge into ${target.name}`}
              onClick={() => { close(); props.onMerge?.(target.id); }}>
              {target.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
