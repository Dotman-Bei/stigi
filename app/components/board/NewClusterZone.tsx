import { useDroppable } from "@dnd-kit/core";

import { NEW_CLUSTER_DROP_ID } from "@/lib/board/drop-target";

export function NewClusterZone() {
  const { setNodeRef, isOver } = useDroppable({ id: NEW_CLUSTER_DROP_ID });
  return (
    <section ref={setNodeRef} className="stigi-newzone" data-testid="new-cluster-zone" data-over={isOver ? "true" : "false"} aria-label="New cluster">
      <p className="stigi-newzone__title">New cluster</p>
      <p className="stigi-newzone__hint">
        Drop a note here to start a cluster. Add a second note and the agent names it and pulls in matches.
      </p>
    </section>
  );
}
