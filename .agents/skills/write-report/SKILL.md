---
name: write-report
description: Use when asked to write the insight report — build it from get-board-digest, save it with save-report, and open the report pane.
---

# Write the insight report

1. Call `get-board-digest`.
2. Write Markdown in exactly this shape (largest theme first, one numbered entry per theme):

   ```
   # Customer feedback insights — <today, YYYY-MM-DD>
   _<totalNotes> comments<if sampleNotes > 0: "; sample data">_

   ## Top themes
   1. **<name>** — <noteCount> comments (<share>%)
      > "<quote 1>"
      > "<quote 2>"
      Suggested next step: <one concrete sentence>

   ## Not yet sorted
   <unsortedCount> comments are not in a theme yet.
   ```

3. Call `save-report` with `{ markdown }`.
4. Call `navigate` with `{ view: "report" }`.
5. Reply with one line, then stop.

Rules: quotes are copied verbatim from the digest (2–3 per theme); never invent counts or quotes;
keep "sample data" in the source line whenever sample notes exist.
