// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

import { downloadMarkdown, reportFileName } from "./report-export";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("report export", () => {
  it("names the file by UTC date", () => {
    expect(reportFileName(new Date("2026-11-09T23:30:00Z"))).toBe("stigi-insight-report-2026-11-09.md");
  });

  it("downloads Markdown through a temporary link", () => {
    const createUrl = vi.fn(() => "blob:stigi");
    Object.defineProperty(URL, "createObjectURL", { value: createUrl, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), configurable: true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    downloadMarkdown("# Report", "stigi-insight-report-2026-11-09.md");
    expect(createUrl).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    const anchor = click.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(anchor.download).toBe("stigi-insight-report-2026-11-09.md");
    expect(document.querySelector("a[download]")).toBeNull();
  });
});
