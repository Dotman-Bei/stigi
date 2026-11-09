/** What the agent chat reported for one submit (the shape of the framework's confirm result). */
export interface DeliveryResult {
  delivered: boolean;
  reason?: string | undefined;
}

/**
 * Send a handoff and confirm the chat received it. When the agent sidebar was closed, the chat may mount
 * after the framework's short submit buffer expires and the first submit times out; `beforeRetry` re-opens
 * the chat and the submit is sent once more. Any other failure, or a second timeout, is returned as is so
 * the caller can show an error instead of leaving the board on "Agent working…".
 */
export async function deliverWithRetry(
  send: () => Promise<DeliveryResult>,
  beforeRetry: () => void,
): Promise<DeliveryResult & { attempts: number }> {
  const first = await send();
  if (first.delivered || first.reason !== "timeout") return { ...first, attempts: 1 };
  beforeRetry();
  const second = await send();
  return { ...second, attempts: 2 };
}
