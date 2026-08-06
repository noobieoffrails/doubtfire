export type AccessDecision = "allow" | "deny" | "sign-in";

const publicPaths = new Set(["/access-denied", "/health", "/robots.txt"]);

type AccessRequest = {
  allowedUserId: string;
  pathname: string;
  userId: string | null;
};

export function getAccessDecision({ allowedUserId, pathname, userId }: AccessRequest): AccessDecision {
  const isSignInPath = pathname === "/sign-in" || pathname.startsWith("/sign-in/");

  if (isSignInPath || publicPaths.has(pathname)) {
    return "allow";
  }

  if (!userId) {
    return "sign-in";
  }

  return userId === allowedUserId ? "allow" : "deny";
}
