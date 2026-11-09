export function reportFileName(date: Date): string {
  return `stigi-insight-report-${date.toISOString().slice(0, 10)}.md`;
}

export function downloadMarkdown(markdown: string, fileName: string): void {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
