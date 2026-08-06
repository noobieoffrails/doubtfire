export const locales = ["en", "fi"] as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

export function getLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : "en";
}

export const dictionaries = {
  en: {
    account: "Account",
    changeLanguage: "Change the language to Finnish",
    doubtfireHome: "Doubtfire home",
    fortnightly: "Fortnightly",
    greeting: "Ready when you are.",
    history: "History",
    home: "Home",
    instruction: "Choose a routine and start.",
    phaseNote: "Available after routine import.",
    primaryNavigation: "Primary navigation",
    quarterly: "Quarterly",
    routines: "Routines",
    settings: "Settings",
    startCleaning: "Start cleaning",
    weekly: "Weekly",
  },
  fi: {
    account: "Tili",
    changeLanguage: "Vaihda kieleksi englanti",
    doubtfireHome: "Doubtfiren etusivu",
    fortnightly: "Joka toinen viikko",
    greeting: "Aloita, kun olet valmis.",
    history: "Historia",
    home: "Koti",
    instruction: "Valitse rutiini ja aloita.",
    phaseNote: "Käytettävissä rutiinien tuonnin jälkeen.",
    primaryNavigation: "Päänavigaatio",
    quarterly: "Neljännesvuosittain",
    routines: "Rutiinit",
    settings: "Asetukset",
    startCleaning: "Aloita siivous",
    weekly: "Viikoittain",
  },
} as const satisfies Record<Locale, Record<string, string>>;
