export const BODY_HEADER_NAMES = ["comment", "feedback", "text", "body", "note", "message"] as const;
export const MAX_BODY_CHARS = 1000;

/** RFC 4180 rows: double-quoted fields, "" escapes, quoted commas/newlines, CRLF or LF, optional BOM. */
export function parseCsvRows(input: string): string[][] {
  const text = input.startsWith("﻿") ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text.charAt(i);
    if (inQuotes) {
      if (ch === '"') {
        if (text.charAt(i + 1) === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Comment bodies: the column named comment/feedback/text/body/note/message, else column 1. */
export function parseFeedbackCsv(input: string): string[] {
  const rows = parseCsvRows(input).filter((r) => r.some((cell) => cell.trim().length > 0));
  const first = rows[0];
  if (!first) return [];
  const header = first.map((cell) => cell.trim().toLowerCase());
  const headerIndex = header.findIndex((cell) => (BODY_HEADER_NAMES as readonly string[]).includes(cell));
  const column = headerIndex >= 0 ? headerIndex : 0;
  const dataRows = headerIndex >= 0 ? rows.slice(1) : rows;
  const bodies: string[] = [];
  for (const r of dataRows) {
    const value = (r[column] ?? "").trim();
    if (value.length === 0) continue;
    bodies.push(value.length > MAX_BODY_CHARS ? value.slice(0, MAX_BODY_CHARS) : value);
  }
  return bodies;
}
