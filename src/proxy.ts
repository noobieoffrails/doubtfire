import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { allowsLocalPreview } from "@/lib/local-preview";

export default allowsLocalPreview() ? () => NextResponse.next() : clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
