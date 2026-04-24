"use client";

import { useState } from "react";

import type { SearchFilters } from "@/types/journal";

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading: boolean;
  defaultQuery?: string;
}

const suggestionsPool = [
  "Machine Learning",
  "Artificial Intelligence",
  "Data Science",
  "Cancer Research",
  "Quantum Computing",
  "Renewable Energy",
  "Public Health",
  "Climate Change",
  "Neural Networks",
  "Bioinformatics",
];

const popularSearches = [
  "Deep Learning",
  "Cancer Research",
  "Climate Science",
  "Vaccine Development",
  "Quantum Physics",
  "Neural Networks",
];

export default function SearchBar({ onSearch, isLoading, defaultQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const suggestions = query
    ? suggestionsPool.filter((item) => item.toLowerCase().includes(query.toLowerCase()))
    : [];

  const runSearch = (value: string) => {
    const currentYear = new Date().getFullYear();
    onSearch({
      query: value.trim(),
      yearFrom: currentYear - 5,
      yearTo: currentYear,
      source: "all",
      sortBy: "relevance",
      pageSize: 10,
      page: 1,
    });
    setShowSuggestions(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }

    runSearch(query);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (query.trim()) {
          runSearch(query);
        }
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => (current < suggestions.length - 1 ? current + 1 : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => (current > 0 ? current - 1 : suggestions.length - 1));
      return;
    }

    if (event.key === "Escape") {
      setShowSuggestions(false);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (selectedIndex >= 0) {
        const selected = suggestions[selectedIndex];
        setQuery(selected);
        runSearch(selected);
      } else {
        handleSubmit(event);
      }
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative mx-auto mb-8 w-full max-w-4xl">
        <div className="relative">
          <label htmlFor="journal-search" className="sr-only">
            Cari jurnal
          </label>
          <input
            id="journal-search"
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowSuggestions(true);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            placeholder="Cari jurnal, paper, topik riset, atau DOI..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 pr-36 text-base text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? "Mencari..." : "Cari"}
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  setQuery(suggestion);
                  runSearch(suggestion);
                }}
                className={`block w-full px-4 py-3 text-left text-sm transition ${
                  selectedIndex === index ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </form>

      {!query && (
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-medium text-slate-600">Pencarian populer</p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => runSearch(item)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
