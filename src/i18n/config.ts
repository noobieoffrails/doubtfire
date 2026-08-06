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
    accessDeniedDescription: "Sign out and use the predefined household account.",
    accessDeniedHeading: "This account cannot open Doubtfire.",
    account: "Account",
    changeLanguage: "Change the language to Finnish",
    cookieInformation: "Cookie information",
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
    signInDescription: "Sign in to open your household cleaning routines.",
    signInForm: "Sign in form",
    signInHeading: "Welcome home.",
    signInTitle: "Sign in",
    signOut: "Sign out",
    startCleaning: "Start cleaning",
    weekly: "Weekly",
  },
  fi: {
    accessDeniedDescription: "Kirjaudu ulos ja käytä kodille ennalta määritettyä tiliä.",
    accessDeniedHeading: "Tällä tilillä ei voi avata Doubtfirea.",
    account: "Tili",
    changeLanguage: "Vaihda kieleksi englanti",
    cookieInformation: "Tietoa evästeistä",
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
    signInDescription: "Kirjaudu sisään ja avaa kodin siivousrutiinit.",
    signInForm: "Kirjautumislomake",
    signInHeading: "Tervetuloa kotiin.",
    signInTitle: "Kirjaudu sisään",
    signOut: "Kirjaudu ulos",
    startCleaning: "Aloita siivous",
    weekly: "Viikoittain",
  },
} as const satisfies Record<Locale, Record<string, string>>;
