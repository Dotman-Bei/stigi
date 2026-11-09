// @vitest-environment happy-dom
import { DndContext } from "@dnd-kit/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BoardNote } from "@shared/board-types";

import { NoteCard } from "./NoteCard";

afterEach(() => cleanup());

const base: BoardNote = {
  id: "n1", body: "which plan am I even on?", source: "sample", clusterId: "c1",
  reason: null, movedBy: null, movedAt: null, position: 0,
};

function renderCard(note: BoardNote, onToggleSelect = vi.fn()) {
  render(
    <DndContext>
      <NoteCard note={note} selected={false} highlighted={false} onToggleSelect={onToggleSelect} />
    </DndContext>,
  );
  return onToggleSelect;
}

describe("NoteCard", () => {
  it("renders the body with test hooks and no reason chip for an untouched sample note", () => {
    renderCard(base);
    const card = screen.getByText("which plan am I even on?").closest("[data-note-id]");
    expect(card?.getAttribute("data-note-id")).toBe("n1");
    expect(card?.getAttribute("data-cluster-id")).toBe("c1");
    expect(card?.getAttribute("data-moved-by")).toBe("none");
    expect(screen.queryByText(/Agent:/)).toBeNull();
    expect(screen.getByText("Sample note")).toBeTruthy();
  });

  it("shows the agent's one-line reason", () => {
    renderCard({ ...base, clusterId: null, movedBy: "agent", reason: "Unsure which plan they're on" });
    expect(screen.getByText("Agent:")).toBeTruthy();
    expect(screen.getByText(/Unsure which plan they're on/)).toBeTruthy();
    const card = screen.getByText("which plan am I even on?").closest("[data-note-id]");
    expect(card?.getAttribute("data-cluster-id")).toBe("unsorted");
    expect(card?.getAttribute("data-moved-by")).toBe("agent");
  });

  it("toggles selection on click", () => {
    const onToggle = renderCard(base);
    fireEvent.click(screen.getByText("which plan am I even on?"));
    expect(onToggle).toHaveBeenCalledWith("n1");
  });
});
