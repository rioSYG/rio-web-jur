"use client";

import React, { createContext, useContext } from "react";
import type { DictionaryContextType, Locale } from "@/lib/i18n";

const TranslationContext = createContext<{ dict: DictionaryContextType; locale: Locale } | null>(null);

export function TranslationProvider({ 
  children, 
  dict, 
  locale 
}: { 
  children: React.ReactNode; 
  dict: DictionaryContextType; 
  locale: Locale;
}) {
  return (
    <TranslationContext.Provider value={{ dict, locale }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
