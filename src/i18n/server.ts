import { cookies } from "next/headers";
import { getLocale, type Locale } from "@/i18n/config";

const languageCookie = "doubtfire-language";

export async function getRequestLocale(): Promise<Locale> {
  return getLocale((await cookies()).get(languageCookie)?.value);
}

export async function setRequestLocale(locale: Locale): Promise<void> {
  (await cookies()).set(languageCookie, locale, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
