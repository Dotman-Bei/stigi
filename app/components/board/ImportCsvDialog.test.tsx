// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImportCsvDialog } from "./ImportCsvDialog";

afterEach(() => cleanup());

describe("ImportCsvDialog", () => {
  it("renders nothing when closed", () => {
    render(<ImportCsvDialog open={false} onClose={vi.fn()} onImport={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("imports pasted CSV and closes on success", async () => {
    const onImport = vi.fn(async () => true);
    const onClose = vi.fn();
    render(<ImportCsvDialog open={true} onClose={onClose} onImport={onImport} />);
    expect(screen.getByRole("dialog", { name: "Import feedback from CSV" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Paste CSV"), { target: { value: "comment\nToo slow" } });
    fireEvent.click(screen.getByRole("button", { name: "Import pasted CSV" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onImport).toHaveBeenCalledWith("comment\nToo slow");
  });

  it("imports a chosen file and stays open when the import fails", async () => {
    const onImport = vi.fn(async () => false);
    const onClose = vi.fn();
    render(<ImportCsvDialog open={true} onClose={onClose} onImport={onImport} />);
    const file = new File(["comment\nFrom a file"], "feedback.csv", { type: "text/csv" });
    fireEvent.change(screen.getByLabelText("CSV file"), { target: { files: [file] } });
    await waitFor(() => expect(onImport).toHaveBeenCalledWith("comment\nFrom a file"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
