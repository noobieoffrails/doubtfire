export type AccessDecision = "allow" | "deny" | "sign-in";

const publicPaths = new Set(["/access-denied", "/health", "/privacy", "/robots.txt"]);

type AccessRequest = {
  allowedUserId: string;
  pathname: string;
  userId: string | null;
};

type UserAccessRequest = Omit<AccessRequest, "pathname">;

export function getUserAccessDecision({
  allowedUserId,
  userId,
}: UserAccessRequest): AccessDecision {
  if (!userId) {
    return "sign-in";
  }

  return userId === allowedUserId ? "allow" : "deny";
}

export function getAccessDecision({ allowedUserId, pathname, userId }: AccessRequest): AccessDecision {
  const isSignInPath = pathname === "/sign-in" || pathname.startsWith("/sign-in/");

  if (isSignInPath || publicPaths.has(pathname)) {
    return "allow";
  }

  return getUserAccessDecision({ allowedUserId, userId });
}
