import { useDraggable } from "@dnd-kit/core";
import { motion } from "motion/react";

import type { BoardNote } from "@shared/board-types";

import { noteDragId } from "@/lib/board/drop-target";

export interface NoteCardProps {
  note: BoardNote;
  selected: boolean;
  highlighted: boolean;
  onToggleSelect: (noteId: string) => void;
}

export function NoteCard({ note, selected, highlighted, onToggleSelect }: NoteCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: noteDragId(note.id) });
  return (
    <motion.div layout="position" layoutId={note.id} transition={{ type: "spring", stiffness: 380, damping: 34 }}>
      <article
        ref={setNodeRef}
        className="stigi-note"
        data-note-id={note.id}
        data-cluster-id={note.clusterId ?? "unsorted"}
        data-moved-by={note.movedBy ?? "none"}
        data-selected={selected ? "true" : "false"}
        data-highlighted={highlighted ? "true" : "false"}
        data-dragging={isDragging ? "true" : "false"}
        onClick={() => onToggleSelect(note.id)}
        {...attributes}
        {...listeners}
      >
        <p className="stigi-note__body">{note.body}</p>
        {note.movedBy === "agent" && note.reason ? (
          <p className="stigi-note__reason" title={note.reason}>
            <span>Agent:</span> {note.reason}
          </p>
        ) : null}
        {note.source === "sample" ? <span className="stigi-sr-only">Sample note</span> : null}
      </article>
    </motion.div>
  );
}
