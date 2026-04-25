"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Filters from "@/components/Filters";
import JournalCard from "@/components/JournalCard";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import { useTranslation } from "@/components/TranslationProvider";
import { getCountries, searchJournals } from "@/lib/api";
import type { Journal, JournalCountry, SearchFilters } from "@/types/journal";

function buildInitialFilters(searchParams: URLSearchParams): SearchFilters {
  const year = new Date().getFullYear();
  return {
    query: searchParams.get("q") || "",
    yearFrom: Number(searchParams.get("from") || year - 5),
    yearTo: Number(searchParams.get("to") || year),
    source: (searchParams.get("source") as SearchFilters["source"]) || "all",
    country: (searchParams.get("country") as SearchFilters["country"]) || "all",
    category: searchParams.get("category") || undefined,
    sortBy: (searchParams.get("sort") as SearchFilters["sortBy"]) || "relevance",
    pageSize: Number(searchParams.get("pageSize") || 10),
    page: Number(searchParams.get("page") || 1),
  };
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { dict, locale } = useTranslation();

  const urlFilters = useMemo(() => buildInitialFilters(searchParams), [searchParams]);
  const [results, setResults] = useState<Journal[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filters = urlFilters;
  const hasSearched = Boolean(filters.query);
  const countries = getCountries(locale);

  const syncUrl = (nextFilters: SearchFilters) => {
    const params = new URLSearchParams();
    if (nextFilters.query) params.set("q", nextFilters.query);
    params.set("from", String(nextFilters.yearFrom));
    params.set("to", String(nextFilters.yearTo));
    params.set("source", nextFilters.source);
    params.set("country", nextFilters.country);
    params.set("sort", nextFilters.sortBy);
    params.set("pageSize", String(nextFilters.pageSize));
    params.set("page", String(nextFilters.page));
    if (nextFilters.category) {
      params.set("category", nextFilters.category);
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const runSearch = useCallback(async (nextFilters: SearchFilters) => {
    await Promise.resolve();

    if (!nextFilters.query.trim()) {
      setResults([]);
      setTotal(0);
      setTotalPages(0);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await searchJournals(nextFilters);
      setResults(response.journals);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (searchError) {
      console.error("Search error:", searchError);
      setResults([]);
      setTotal(0);
      setTotalPages(0);
      setError(searchError instanceof Error ? searchError.message : dict.results.genericError);
    } finally {
      setIsLoading(false);
    }
  }, [dict.results.genericError]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void runSearch(urlFilters);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [runSearch, urlFilters]);

  const handleSearch = (nextFilters: SearchFilters) => {
    const updatedFilters = { ...nextFilters, country: filters.country, page: 1 };
    syncUrl(updatedFilters);
    void runSearch(updatedFilters);
  };

  const handleCountryChange = (country: JournalCountry) => {
    const updatedFilters = {
      ...filters,
      country,
      source: "all" as const,
      page: 1,
    };
    syncUrl(updatedFilters);
    if (hasSearched) void runSearch(updatedFilters);
  };

  const handleFilterChange = (nextFilters: SearchFilters) => {
    const updatedFilters = { ...nextFilters, page: 1 };
    syncUrl(updatedFilters);
    void runSearch(updatedFilters);
  };

  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page };
    syncUrl(updatedFilters);
    void runSearch(updatedFilters);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setResults([]);
    setTotal(0);
    setTotalPages(0);
    setError(null);
    router.push(pathname);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16 selection:bg-indigo-100 selection:text-indigo-900">
      <section className="relative overflow-hidden bg-slate-950 pb-20 pt-16 shadow-2xl sm:pt-24">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[60rem] max-w-none -translate-y-[30%] rounded-full bg-indigo-500/15 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-indigo-300">
              <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              {dict.hero.badge}
            </span>
            <h1 className="mt-8 font-serif text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
              {dict.hero.title}{" "}
              <span className="bg-gradient-to-r from-indigo-300 to-blue-300 bg-clip-text italic text-transparent">
                RIO
              </span>
            </h1>
            <p className="mt-6 text-base font-light leading-8 text-slate-400 md:text-xl">{dict.hero.subtitle}</p>

            <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md">
              <p className="mb-5 text-sm font-medium uppercase tracking-widest text-slate-300">
                {dict.hero.scopeTitle}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {countries.map((country) => (
                  <button
                    key={country.id}
                    type="button"
                    id={`country-btn-${country.id}`}
                    onClick={() => handleCountryChange(country.id)}
                    className={`flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-bold transition-all duration-300 ${
                      filters.country === country.id
                        ? "border-indigo-500 bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30"
                        : "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-indigo-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-semibold">{country.icon}</span>
                    {country.name}
                  </button>
                ))}
              </div>

              {filters.country === "id" && (
                <div className="mx-auto mt-6 max-w-md rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
                  <span dangerouslySetInnerHTML={{ __html: dict.hero.idMode }} />
                </div>
              )}
              {filters.country === "global" && (
                <div className="mx-auto mt-6 max-w-md rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                  <span dangerouslySetInnerHTML={{ __html: dict.hero.globalMode }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-14">
        <SearchBar
          key={`${filters.query}-${filters.page}-${filters.source}-${filters.sortBy}-${filters.country}`}
          onSearch={handleSearch}
          isLoading={isLoading}
          defaultQuery={filters.query}
        />

        {hasSearched && (
          <Filters
            filters={filters}
            onFilterChange={handleFilterChange}
            isExpanded
          />
        )}

        {!hasSearched && (
          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-sm font-semibold text-blue-700">
                ID
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{dict.hero.localSourcesTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{dict.hero.localSourcesDesc}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-sm font-semibold text-purple-700">
                GL
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{dict.hero.globalSourcesTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{dict.hero.globalSourcesDesc}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-semibold text-emerald-700">
                PDF
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{dict.hero.exportTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{dict.hero.exportDesc}</p>
            </div>
          </section>
        )}

        {hasSearched && (
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              {isLoading ? (
                <div className="flex items-center justify-center gap-3 py-10 text-slate-600">
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                  {dict.search.searching}
                </div>
              ) : error ? (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-slate-900">{dict.results.failed}</h2>
                  <p className="text-sm text-rose-600">{error}</p>
                </div>
              ) : total > 0 ? (
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">{dict.results.heading}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {dict.results.found} <span className="font-semibold text-slate-900">{total}</span>{" "}
                      {dict.results.resultsFor}
                      <span className="font-semibold"> &quot;{filters.query}&quot;</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    {dict.results.resetSearch}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-slate-900">{dict.results.noResultTitle}</h2>
                  <p className="text-sm text-slate-600">
                    {filters.country === "id" ? dict.results.noResultDescId : dict.results.noResultDescGlobal}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filters.country === "id" && (
                      <button
                        type="button"
                        onClick={() => handleCountryChange("global")}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                      >
                        {dict.results.tryGlobal}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleReset}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      {dict.results.newSearch}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div className="space-y-4">
                {results.map((journal) => (
                  <JournalCard key={journal.id} journal={journal} />
                ))}
              </div>
            )}

            {results.length > 0 && (
              <Pagination
                currentPage={filters.page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { dict } = useTranslation();

  return (
    <Suspense fallback={<div className="py-12 text-center text-slate-600">{dict.common.loadingApp}</div>}>
      <SearchResults />
    </Suspense>
  );
}
