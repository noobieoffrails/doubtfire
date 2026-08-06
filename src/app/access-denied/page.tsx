import { SignOutButton } from "@clerk/nextjs";
import { ShieldX } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { dictionaries } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return { title: dictionaries[locale].accessDeniedTitle };
}

export default async function AccessDeniedPage() {
  const locale = await getRequestLocale();
  const copy = dictionaries[locale];

  return (
    <main className="signInPage">
      <section className="signInIntro" aria-labelledby="access-denied-heading">
        <div className="signInCopy">
          <span className="signInMark" aria-hidden="true">
            <ShieldX />
          </span>
          <h1 id="access-denied-heading">{copy.accessDeniedHeading}</h1>
          <p>{copy.accessDeniedDescription}</p>
          <SignOutButton redirectUrl="/sign-in">
            <Button>{copy.signOut}</Button>
          </SignOutButton>
        </div>
      </section>
    </main>
  );
}
