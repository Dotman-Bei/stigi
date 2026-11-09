import { describe, expect, it, vi } from "vitest";

import { deliverWithRetry, type DeliveryResult } from "./handoff-delivery";

function sender(results: DeliveryResult[]) {
  let call = 0;
  return vi.fn(async (): Promise<DeliveryResult> => results[Math.min(call++, results.length - 1)] ?? { delivered: false });
}

describe("deliverWithRetry", () => {
  it("returns after one attempt when the chat confirms the submit", async () => {
    const send = sender([{ delivered: true }]);
    const beforeRetry = vi.fn();
    await expect(deliverWithRetry(send, beforeRetry)).resolves.toEqual({ delivered: true, attempts: 1 });
    expect(send).toHaveBeenCalledTimes(1);
    expect(beforeRetry).not.toHaveBeenCalled();
  });

  it("re-opens the chat and retries once when the first submit timed out (chat mounted late)", async () => {
    const send = sender([{ delivered: false, reason: "timeout" }, { delivered: true }]);
    const beforeRetry = vi.fn();
    await expect(deliverWithRetry(send, beforeRetry)).resolves.toEqual({ delivered: true, attempts: 2 });
    expect(send).toHaveBeenCalledTimes(2);
    expect(beforeRetry).toHaveBeenCalledTimes(1);
  });

  it("gives up after the retry also times out, so the caller can show an error instead of hanging", async () => {
    const send = sender([{ delivered: false, reason: "timeout" }, { delivered: false, reason: "timeout" }]);
    await expect(deliverWithRetry(send, () => {})).resolves.toEqual({ delivered: false, reason: "timeout", attempts: 2 });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("does not retry a failure that is not a timeout", async () => {
    const send = sender([{ delivered: false, reason: "unsupported-target" }]);
    await expect(deliverWithRetry(send, () => {})).resolves.toEqual({ delivered: false, reason: "unsupported-target", attempts: 1 });
    expect(send).toHaveBeenCalledTimes(1);
  });
});
