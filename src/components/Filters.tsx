"use client";

import { useState } from "react";

import { useTranslation } from "@/components/TranslationProvider";
import { getCategories, getCountryLabel, getSources } from "@/lib/api";
import type { SearchFilters } from "@/types/journal";

interface FiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  isExpanded?: boolean;
}

export default function Filters({ filters, onFilterChange, isExpanded = true }: FiltersProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  const { dict, locale } = useTranslation();
  const allSources = getSources(locale);
  const categories = getCategories(locale);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear - i);

  const visibleSources = allSources.filter((source) => {
    if (filters.country === "id") return source.country === "id" || source.id === "all";
    if (filters.country === "global") return !source.country || source.id === "all";
    return true;
  });

  const activeSource = visibleSources.find((source) => source.id === filters.source)?.name ?? dict.filters.allSource;
  const activeCountry = filters.country === "all" ? "" : `${getCountryLabel(filters.country, locale)} · `;

  const update = (partial: Partial<SearchFilters>) => {
    onFilterChange({ ...filters, ...partial, page: 1 });
  };

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-base">Cfg</span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{dict.filters.title}</p>
            <p className="text-xs text-slate-500">
              {activeCountry}
              {activeSource} · {filters.yearFrom}-{filters.yearTo}
            </p>
          </div>
        </div>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-600 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          v
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="block text-sm text-slate-700">
              <span className="mb-1.5 block font-medium text-slate-800">{dict.filters.source}</span>
              <select
                value={filters.source}
                onChange={(event) => update({ source: event.target.value as SearchFilters["source"] })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {visibleSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1.5 block font-medium text-slate-800">{dict.filters.sort}</span>
              <select
                value={filters.sortBy}
                onChange={(event) => update({ sortBy: event.target.value as SearchFilters["sortBy"] })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="relevance">{dict.filters.relevance}</option>
                <option value="date">{dict.filters.latest}</option>
                <option value="citations">{dict.filters.citations}</option>
              </select>
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1.5 block font-medium text-slate-800">{dict.filters.category}</span>
              <select
                value={filters.category || ""}
                onChange={(event) => update({ category: event.target.value || undefined })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">{dict.filters.allCategory}</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1.5 block font-medium text-slate-800">{dict.filters.yearFrom}</span>
              <select
                value={filters.yearFrom}
                onChange={(event) => update({ yearFrom: Number(event.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1.5 block font-medium text-slate-800">{dict.filters.yearTo}</span>
              <select
                value={filters.yearTo}
                onChange={(event) => update({ yearTo: Number(event.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1.5 block font-medium text-slate-800">{dict.filters.pageSize}</span>
              <select
                value={filters.pageSize}
                onChange={(event) => update({ pageSize: Number(event.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="50">50</option>
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
