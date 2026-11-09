import type { Actor } from "../../shared/board-types.js";

export interface CallerContext {
  caller?: string | undefined;
}

/** The agent calls actions as a tool; every other surface (UI, CLI, HTTP) is the user. */
export function actorFromCtx(ctx: CallerContext | undefined): Actor {
  return ctx?.caller === "tool" ? "agent" : "user";
}
