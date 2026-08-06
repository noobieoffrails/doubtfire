import { SignIn } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <main className="signInPage">
      <section className="signInIntro" aria-labelledby="sign-in-heading">
        <Link className="wordmark" href="/">
          Doubtfire
        </Link>
        <div className="signInCopy">
          <span className="signInMark" aria-hidden="true">
            <Sparkles />
          </span>
          <h1 id="sign-in-heading">Welcome home.</h1>
          <p>Sign in to open your household cleaning routines.</p>
        </div>
      </section>
      <section className="signInPanel" aria-label="Sign in form">
        <SignIn
          path="/sign-in"
          routing="path"
          withSignUp={false}
          appearance={{
            variables: {
              colorPrimary: "#075cf5",
              colorForeground: "#10184d",
              colorBackground: "#ffffff",
              colorMutedForeground: "#56628b",
              borderRadius: "0.875rem",
              fontFamily: "var(--font-manrope), sans-serif",
            },
            elements: {
              rootBox: "clerkRoot",
              cardBox: "clerkCardBox",
              card: "clerkCard",
              headerTitle: "clerkHeaderTitle",
              headerSubtitle: "clerkHeaderSubtitle",
              footer: "clerkFooter",
            },
          }}
        />
      </section>
    </main>
  );
}
