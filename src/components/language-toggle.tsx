import { Globe2 } from "lucide-react";
import { setLanguage } from "@/app/actions";
import type { Locale } from "@/i18n/config";

export function LanguageToggle({ locale, label }: { locale: Locale; label: string }) {
  const nextLocale: Locale = locale === "en" ? "fi" : "en";

  return (
    <form action={setLanguage}>
      <input name="locale" type="hidden" value={nextLocale} />
      <button className="languageToggle" type="submit" aria-label={label}>
        <Globe2 aria-hidden="true" strokeWidth={2} />
        <span>{locale.toUpperCase()}</span>
      </button>
    </form>
  );
}
