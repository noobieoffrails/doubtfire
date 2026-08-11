import { pluralDictionaries, type Locale } from "./config";

type PluralKey = keyof (typeof pluralDictionaries)[Locale];

const pluralRules: Record<Locale, Intl.PluralRules> = {
  en: new Intl.PluralRules("en"),
  fi: new Intl.PluralRules("fi"),
};

export function formatPlural(
  locale: Locale,
  key: PluralKey,
  count: number,
): string {
  const forms = pluralDictionaries[locale][key];
  const category = pluralRules[locale].select(count);
  const template = category === "one" ? forms.one : forms.other;

  return template.replace("{count}", String(count));
}
