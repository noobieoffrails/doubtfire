import type { Metadata } from "next";
import Link from "next/link";
import { LanguageToggle } from "@/components/language-toggle";
import { dictionaries, type Locale } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";

export const metadata: Metadata = {
  title: "Cookie information",
};

const privacyCopy = {
  en: {
    back: "Return to sign in",
    clerkDescription:
      "Clerk sets cookies that keep the predefined account signed in and protect its session. Clerk requires these cookies for authentication.",
    clerkHeading: "Authentication",
    consent:
      "Doubtfire does not ask for cookie consent because it does not use optional cookies. If optional analytics or tracking is added later, it must stay off until the user gives consent.",
    intro:
      "Doubtfire uses only cookies that provide authentication or remember a setting that you selected.",
    languageDescription:
      "Doubtfire stores the selected interface language in the doubtfire-language cookie for one year.",
    languageHeading: "Language",
    noTracking: "Doubtfire does not use analytics, advertising, or cross-site tracking cookies.",
    noTrackingHeading: "No tracking",
    title: "Cookie information",
  },
  fi: {
    back: "Palaa kirjautumiseen",
    clerkDescription:
      "Clerk asettaa evästeitä, jotka pitävät ennalta määritetyn tilin kirjautuneena ja suojaavat istuntoa. Clerk tarvitsee näitä evästeitä tunnistautumiseen.",
    clerkHeading: "Tunnistautuminen",
    consent:
      "Doubtfire ei pyydä evästesuostumusta, koska se ei käytä valinnaisia evästeitä. Jos palveluun lisätään myöhemmin valinnaista analytiikkaa tai seurantaa, sen täytyy pysyä pois käytöstä, kunnes käyttäjä antaa suostumuksen.",
    intro:
      "Doubtfire käyttää vain evästeitä, joita tarvitaan tunnistautumiseen tai käyttäjän valitseman asetuksen muistamiseen.",
    languageDescription:
      "Doubtfire tallentaa valitun käyttöliittymän kielen doubtfire-language-evästeeseen vuodeksi.",
    languageHeading: "Kieli",
    noTracking: "Doubtfire ei käytä analytiikka-, mainonta- tai sivustojen välisiä seurantaevästeitä.",
    noTrackingHeading: "Ei seurantaa",
    title: "Tietoa evästeistä",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export default async function PrivacyPage() {
  const locale = await getRequestLocale();
  const copy = privacyCopy[locale];
  const commonCopy = dictionaries[locale];

  return (
    <main className="privacyPage">
      <header className="privacyHeader">
        <Link className="wordmark" href="/">
          Doubtfire
        </Link>
        <LanguageToggle locale={locale} label={commonCopy.changeLanguage} />
      </header>
      <article className="privacyContent">
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
        <h2>{copy.clerkHeading}</h2>
        <p>{copy.clerkDescription}</p>
        <h2>{copy.languageHeading}</h2>
        <p>{copy.languageDescription}</p>
        <h2>{copy.noTrackingHeading}</h2>
        <p>{copy.noTracking}</p>
        <p>{copy.consent}</p>
        <Link className="privacyBack" href="/sign-in">
          {copy.back}
        </Link>
      </article>
    </main>
  );
}
