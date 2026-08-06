import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/health", "/sign-in(.*)"]);
const allowsLocalPreview =
  process.env.NODE_ENV !== "production" &&
  process.env.DOUBTFIRE_ALLOW_UNAUTHENTICATED_PREVIEW === "1";

const protectedProxy = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export default allowsLocalPreview ? () => NextResponse.next() : protectedProxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
