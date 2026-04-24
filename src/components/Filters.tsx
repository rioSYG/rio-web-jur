"use client";

import { useState } from "react";

import { getCategories, getSources } from "@/lib/api";
import type { SearchFilters } from "@/types/journal";

interface FiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  isExpanded?: boolean;
}

export default function Filters({ filters, onFilterChange, isExpanded = false }: FiltersProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  const sources = getSources();
  const categories = getCategories();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, index) => currentYear - index);

  const updateFilters = (partial: Partial<SearchFilters>) => {
    onFilterChange({
      ...filters,
      ...partial,
      page: 1,
    });
  };

  return (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900">Filter pencarian</h2>
          <p className="text-sm text-slate-500">Saring sumber, tahun, kategori, dan urutan hasil.</p>
        </div>
        <span className={`text-slate-500 transition ${expanded ? "rotate-180" : ""}`}>v</span>
      </button>

      {expanded && (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block text-sm text-slate-700">
            <span className="mb-2 block font-medium">Sumber</span>
            <select
              value={filters.source}
              onChange={(event) => updateFilters({ source: event.target.value as SearchFilters["source"] })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-700">
            <span className="mb-2 block font-medium">Kategori</span>
            <select
              value={filters.category || ""}
              onChange={(event) => updateFilters({ category: event.target.value || undefined })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-700">
            <span className="mb-2 block font-medium">Urutkan</span>
            <select
              value={filters.sortBy}
              onChange={(event) => updateFilters({ sortBy: event.target.value as SearchFilters["sortBy"] })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="relevance">Relevansi</option>
              <option value="date">Terbaru</option>
              <option value="citations">Sitasi</option>
            </select>
          </label>

          <label className="block text-sm text-slate-700">
            <span className="mb-2 block font-medium">Dari tahun</span>
            <select
              value={filters.yearFrom}
              onChange={(event) => updateFilters({ yearFrom: Number(event.target.value) })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-700">
            <span className="mb-2 block font-medium">Sampai tahun</span>
            <select
              value={filters.yearTo}
              onChange={(event) => updateFilters({ yearTo: Number(event.target.value) })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-700">
            <span className="mb-2 block font-medium">Hasil per halaman</span>
            <select
              value={filters.pageSize}
              onChange={(event) => updateFilters({ pageSize: Number(event.target.value) })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="10">10 hasil</option>
              <option value="20">20 hasil</option>
              <option value="30">30 hasil</option>
              <option value="50">50 hasil</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
