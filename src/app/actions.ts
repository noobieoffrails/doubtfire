"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale } from "@/i18n/config";

export async function setLanguage(formData: FormData): Promise<void> {
  const locale = formData.get("locale");

  if (!isLocale(locale)) {
    return;
  }

  (await cookies()).set("doubtfire-language", locale, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/");
}
