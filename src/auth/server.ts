import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAllowedClerkUserId } from "@/env/server";

export async function requireAllowedUser(): Promise<string> {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  if (userId !== getAllowedClerkUserId()) {
    redirect("/access-denied");
  }

  return userId;
}
