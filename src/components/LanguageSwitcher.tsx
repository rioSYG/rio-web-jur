"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { setLanguageCookie } from "@/app/actions";
import { useTranslation } from "./TranslationProvider";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const router = useRouter();
  const { dict, locale } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      await setLanguageCookie(newLocale);
      setIsOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={dict.language.current}
        disabled={isPending}
        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 hover:border-slate-300"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span>{isPending ? "..." : locale === "id" ? "Bahasa" : "Language"}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-slate-200">
          <div className="p-2">
            <button
              type="button"
              onClick={() => handleLanguageChange("id")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                locale === "id"
                  ? "bg-indigo-50 font-semibold text-indigo-700"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="text-base">🇮🇩</span>
              <div>
                <div className="font-medium">Indonesia</div>
                <div className="text-xs opacity-75">ID</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange("en")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                locale === "en"
                  ? "bg-indigo-50 font-semibold text-indigo-700"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="text-base">🇬🇧</span>
              <div>
                <div className="font-medium">English</div>
                <div className="text-xs opacity-75">EN</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
