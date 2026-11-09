import { fail } from "@agent-native/core/action";

export interface OwnerContext {
  userEmail?: string | undefined;
}

/** The signed-in user's email; every stigi_* row is scoped to it. */
export function requireOwner(ctx: OwnerContext | undefined): string {
  const email = ctx?.userEmail?.trim();
  if (!email) {
    fail("Sign in to use Stigi.", { errorCode: "unauthenticated", statusCode: 401 });
  }
  return email;
}
