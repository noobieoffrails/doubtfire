import { SignIn } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LanguageToggle } from "@/components/language-toggle";
import { dictionaries } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return { title: dictionaries[locale].signInTitle };
}

export default async function SignInPage() {
  const locale = await getRequestLocale();
  const copy = dictionaries[locale];

  return (
    <main className="signInPage">
      <section className="signInIntro" aria-labelledby="sign-in-heading">
        <div className="signInTop">
          <Link className="wordmark" href="/">
            Doubtfire
          </Link>
          <LanguageToggle locale={locale} label={copy.changeLanguage} />
        </div>
        <div className="signInCopy">
          <span className="signInMark" aria-hidden="true">
            <Sparkles />
          </span>
          <h1 id="sign-in-heading">{copy.signInHeading}</h1>
          <p>{copy.signInDescription}</p>
        </div>
      </section>
      <section className="signInPanel" aria-label={copy.signInForm}>
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
        <Link className="privacyLink" href="/privacy">
          {copy.cookieInformation}
        </Link>
      </section>
    </main>
  );
}
