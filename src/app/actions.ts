"use server";

import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n";

export async function setLanguageCookie(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
