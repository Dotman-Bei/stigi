export function meta() {
  return [{ title: "Feedback board · Stigi" }];
}

export default function BoardRoute() {
  return (
    <div data-testid="board-shell" style={{ padding: 24 }}>
      <h1>Feedback board</h1>
      <p>Your Stigi board is ready. Notes and themes appear here.</p>
    </div>
  );
}
