import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserAccessDecision } from "@/auth/policy";
import { getAllowedClerkUserId } from "@/env/server";

export async function requireAllowedUser(): Promise<string> {
  const { userId, redirectToSignIn } = await auth();
  const decision = getUserAccessDecision({
    allowedUserId: getAllowedClerkUserId(),
    userId,
  });

  if (decision === "sign-in") {
    return redirectToSignIn();
  }

  if (decision === "deny") {
    redirect("/access-denied");
  }

  return userId as string;
}
