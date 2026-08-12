"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { dictionaries } from "@/i18n/config";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
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
          <div className="errorActions">
            <Button type="button" onClick={retry}>
              {copy.tryAgain}
            </Button>
            <Link className="errorHomeLink" href="/">
              {copy.backHome}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
