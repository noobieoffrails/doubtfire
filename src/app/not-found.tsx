import { SearchX } from "lucide-react";
import Link from "next/link";

import { dictionaries } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";

export default async function NotFoundPage() {
  const locale = await getRequestLocale();
  const copy = dictionaries[locale];

  return (
    <main className="signInPage">
      <section className="signInIntro" aria-labelledby="not-found-heading">
        <div className="signInCopy">
          <span className="signInMark" aria-hidden="true">
            <SearchX />
          </span>
          <h1 id="not-found-heading">{copy.notFoundHeading}</h1>
          <p>{copy.notFoundDescription}</p>
          <Link className="startButton continueRunLink" href="/">
            {copy.backHome}
          </Link>
        </div>
      </section>
    </main>
  );
}
