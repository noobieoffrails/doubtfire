"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { Locale } from "@/i18n/config";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}
