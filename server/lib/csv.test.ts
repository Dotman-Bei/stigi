import { describe, expect, it } from "vitest";

import { MAX_BODY_CHARS, parseCsvRows, parseFeedbackCsv } from "./csv.js";

describe("parseCsvRows", () => {
  it("handles quotes, escaped quotes, quoted commas and newlines, CRLF and a BOM", () => {
    const input = '﻿id,comment\r\n1,"Hello, world"\r\n2,"She said ""hi""\nthen left"\r\n';
    expect(parseCsvRows(input)).toEqual([
      ["id", "comment"],
      ["1", "Hello, world"],
      ["2", 'She said "hi"\nthen left'],
    ]);
  });
});

describe("parseFeedbackCsv", () => {
  it("uses a recognised header column and skips the header row", () => {
    expect(parseFeedbackCsv("source,Feedback\napp store,Too slow\nemail,  Love it  \n")).toEqual(["Too slow", "Love it"]);
  });

  it("accepts every documented header name", () => {
    for (const header of ["comment", "feedback", "text", "body", "note", "message"]) {
      expect(parseFeedbackCsv(`${header}\nA comment`)).toEqual(["A comment"]);
    }
  });

  it("falls back to the first column when there is no recognised header", () => {
    expect(parseFeedbackCsv("Crashes on login,ios\nGreat support,web")).toEqual(["Crashes on login", "Great support"]);
  });

  it("drops empty rows and empty bodies, and truncates long bodies", () => {
    const long = "x".repeat(MAX_BODY_CHARS + 50);
    expect(parseFeedbackCsv(`comment\n\n   \n"${long}"\n`)).toEqual(["x".repeat(MAX_BODY_CHARS)]);
    expect(parseFeedbackCsv("")).toEqual([]);
  });
});
