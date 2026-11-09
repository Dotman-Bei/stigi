// @vitest-environment happy-dom
import { DndContext } from "@dnd-kit/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BoardNote } from "@shared/board-types";

import { ClusterColumn } from "./ClusterColumn";
import { ClusterMenu } from "./ClusterMenu";
import { NewClusterZone } from "./NewClusterZone";

afterEach(() => cleanup());

function note(id: string): BoardNote {
  return { id, body: `body ${id}`, source: "sample", clusterId: "c1", reason: null, movedBy: null, movedAt: null, position: 0 };
}

function column(untitled: boolean, notes: BoardNote[]) {
  render(
    <DndContext>
      <ClusterColumn
        dropId="drop:cluster:c1" clusterId="c1" title={untitled ? "Untitled" : "Mobile app"} untitled={untitled}
        notes={notes} selectedIds={new Set()} highlightedIds={new Set()} onToggleSelect={vi.fn()} actions={null}
      />
      <NewClusterZone />
    </DndContext>,
  );
}

describe("ClusterColumn", () => {
  it("renders a named column with its count, notes and test hooks", () => {
    column(false, [note("a"), note("b")]);
    expect(screen.getByRole("heading", { name: "Mobile app" })).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    const section = screen.getByRole("region", { name: "Mobile app" });
    expect(section.getAttribute("data-cluster-name")).toBe("Mobile app");
    expect(section.querySelectorAll("[data-note-id]")).toHaveLength(2);
    expect(screen.getByTestId("new-cluster-zone")).toBeTruthy();
    expect(screen.getByText(/the agent names it and pulls in matches/)).toBeTruthy();
  });

  it("explains the untitled states", () => {
    column(true, [note("a")]);
    expect(screen.getByText("Untitled — drop one more note to teach the agent")).toBeTruthy();
    cleanup();
    column(true, [note("a"), note("b")]);
    expect(screen.getByText("Untitled — the agent is naming this…")).toBeTruthy();
  });
});

describe("ClusterMenu", () => {
  it("offers more-like-these and inline rename; hides merge and delete without handlers", () => {
    const onMore = vi.fn();
    const onRename = vi.fn();
    render(<ClusterMenu clusterName="Mobile app" agentDisabled={false} onMoreLikeThese={onMore} onRename={onRename} mergeTargets={[]} onMerge={null} onDelete={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Cluster actions for Mobile app" }));
    expect(screen.queryByRole("button", { name: "Merge into…" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete cluster" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "More like these" }));
    expect(onMore).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Cluster actions for Mobile app" }));
    fireEvent.click(screen.getByRole("button", { name: "Rename" }));
    fireEvent.change(screen.getByLabelText("Cluster name"), { target: { value: "  Mobile crashes  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    expect(onRename).toHaveBeenCalledWith("Mobile crashes");
  });

  it("merges into a chosen target and deletes only on the second click", () => {
    const onMerge = vi.fn();
    const onDelete = vi.fn();
    render(<ClusterMenu clusterName="A" agentDisabled={true} onMoreLikeThese={vi.fn()} onRename={vi.fn()} mergeTargets={[{ id: "c2", name: "B" }]} onMerge={onMerge} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: "Cluster actions for A" }));
    expect((screen.getByRole("button", { name: "More like these" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Merge into…" }));
    fireEvent.click(screen.getByRole("button", { name: "Merge into B" }));
    expect(onMerge).toHaveBeenCalledWith("c2");
    fireEvent.click(screen.getByRole("button", { name: "Cluster actions for A" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete cluster" }));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Click again to delete" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
