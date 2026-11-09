import { useDroppable } from "@dnd-kit/core";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import type { BoardNote } from "@shared/board-types";

import { NoteCard } from "./NoteCard";

export interface ClusterColumnProps {
  dropId: string;
  clusterId: string | null;
  title: string;
  untitled: boolean;
  notes: BoardNote[];
  selectedIds: ReadonlySet<string>;
  highlightedIds: ReadonlySet<string>;
  onToggleSelect: (noteId: string) => void;
  actions: ReactNode;
}

function untitledCopy(count: number): string {
  return count < 2 ? "Untitled — drop one more note to teach the agent" : "Untitled — the agent is naming this…";
}

export function ClusterColumn(props: ClusterColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: props.dropId });
  return (
    <section
      ref={setNodeRef}
      className="stigi-column"
      aria-label={props.title}
      data-cluster-id={props.clusterId ?? "unsorted"}
      data-cluster-name={props.title}
      data-over={isOver ? "true" : "false"}
    >
      <header className="stigi-column__header">
        <h2 className={props.untitled ? "stigi-column__title stigi-column__title--untitled" : "stigi-column__title"}>
          {props.untitled ? untitledCopy(props.notes.length) : props.title}
        </h2>
        <span className="stigi-column__count">{props.notes.length}</span>
        {props.actions}
      </header>
      <motion.div layoutScroll className="stigi-column__notes">
        {props.notes.map((n) => (
          <NoteCard
            key={n.id}
            note={n}
            selected={props.selectedIds.has(n.id)}
            highlighted={props.highlightedIds.has(n.id)}
            onToggleSelect={props.onToggleSelect}
          />
        ))}
      </motion.div>
    </section>
  );
}
