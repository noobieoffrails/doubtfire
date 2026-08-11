"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { dictionaries } from "@/i18n/config";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const copy = dictionaries[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="signInPage">
      <section className="signInIntro" aria-labelledby="error-heading">
        <div className="signInCopy">
          <span className="signInMark" aria-hidden="true">
            <AlertTriangle />
          </span>
          <h1 id="error-heading">{copy.errorHeading}</h1>
          <p>{copy.errorDescription}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button type="button" onClick={reset}>
              {copy.tryAgain}
            </Button>
            <Link className="font-bold text-[var(--cobalt)]" href="/">
              {copy.backHome}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
