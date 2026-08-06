"use server";

import { revalidatePath } from "next/cache";
import { isLocale } from "@/i18n/config";
import { setRequestLocale } from "@/i18n/server";

export async function setLanguage(formData: FormData): Promise<void> {
  const locale = formData.get("locale");

  if (!isLocale(locale)) {
    return;
  }

  await setRequestLocale(locale);

  revalidatePath("/", "layout");
}
