import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAccessDecision } from "@/auth/policy";
import { getAllowedClerkUserId } from "@/env/server";
import { allowsLocalPreview } from "@/lib/local-preview";

export default allowsLocalPreview()
  ? () => NextResponse.next()
  : clerkMiddleware(async (auth, request) => {
      const { redirectToSignIn, userId } = await auth();
      const decision = getAccessDecision({
        allowedUserId: getAllowedClerkUserId(),
        pathname: request.nextUrl.pathname,
        userId,
      });

      if (decision === "sign-in") {
        return redirectToSignIn({ returnBackUrl: request.url });
      }

      if (decision === "deny") {
        return NextResponse.redirect(new URL("/access-denied", request.url));
      }

      return NextResponse.next();
    });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
