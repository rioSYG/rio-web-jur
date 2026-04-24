"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Filters from "@/components/Filters";
import JournalCard from "@/components/JournalCard";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import { searchJournals } from "@/lib/api";
import type { Journal, SearchFilters } from "@/types/journal";

function buildInitialFilters(searchParams: URLSearchParams): SearchFilters {
  const year = new Date().getFullYear();
  return {
    query: searchParams.get("q") || "",
    yearFrom: Number(searchParams.get("from") || year - 5),
    yearTo: Number(searchParams.get("to") || year),
    source: (searchParams.get("source") as SearchFilters["source"]) || "all",
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

  const urlFilters = useMemo(() => buildInitialFilters(searchParams), [searchParams]);
  const [results, setResults] = useState<Journal[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filters = urlFilters;
  const hasSearched = Boolean(filters.query);

  const syncUrl = (nextFilters: SearchFilters) => {
    const params = new URLSearchParams();
    if (nextFilters.query) params.set("q", nextFilters.query);
    params.set("from", String(nextFilters.yearFrom));
    params.set("to", String(nextFilters.yearTo));
    params.set("source", nextFilters.source);
    params.set("sort", nextFilters.sortBy);
    params.set("pageSize", String(nextFilters.pageSize));
    params.set("page", String(nextFilters.page));
    if (nextFilters.category) {
      params.set("category", nextFilters.category);
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const runSearch = async (nextFilters: SearchFilters) => {
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
      setError(searchError instanceof Error ? searchError.message : "Pencarian gagal dijalankan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void runSearch(urlFilters);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [urlFilters]);

  const handleSearch = (nextFilters: SearchFilters) => {
    const updatedFilters = { ...nextFilters, page: 1 };
    syncUrl(updatedFilters);
    void runSearch(updatedFilters);
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.55),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#ffffff)]">
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
              Pencarian jurnal multi-sumber
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              Akses hasil pencarian jurnal dengan jalur baca dan download yang lebih rapi
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-600 md:text-lg">
              Cari artikel dari Crossref, arXiv, dan PubMed, buka halaman sumbernya, unduh PDF asli bila tersedia,
              lalu ekspor detail jurnal ke PDF atau DOCX langsung dari aplikasi.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-14">
        <SearchBar
          key={`${filters.query}-${filters.page}-${filters.source}-${filters.sortBy}`}
          onSearch={handleSearch}
          isLoading={isLoading}
          defaultQuery={filters.query}
        />

        {hasSearched && (
          <Filters filters={filters} onFilterChange={handleFilterChange} isExpanded={false} />
        )}

        {!hasSearched && (
          <section className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Akses sumber</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Setiap hasil sekarang punya jalur ke halaman sumber, halaman full text, dan PDF sumber bila memang
                tersedia secara legal.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Ekspor dokumen</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Detail jurnal bisa diunduh sebagai PDF atau DOCX untuk kebutuhan baca offline dan dokumentasi riset.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Filter lebih stabil</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sumber, kategori, tahun, dan pagination sekarang lewat API server supaya hasil lebih konsisten.
              </p>
            </div>
          </section>
        )}

        {hasSearched && (
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              {isLoading ? (
                <div className="py-10 text-center text-slate-600">Mencari jurnal terbaik...</div>
              ) : error ? (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-slate-900">Pencarian belum berhasil</h2>
                  <p className="text-sm text-rose-600">{error}</p>
                </div>
              ) : total > 0 ? (
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Hasil pencarian</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Ditemukan sekitar <span className="font-semibold text-slate-900">{total}</span> hasil untuk
                      <span className="font-semibold"> &quot;{filters.query}&quot;</span>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    Reset pencarian
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-slate-900">Tidak ada hasil yang cocok</h2>
                  <p className="text-sm text-slate-600">
                    Coba kata kunci yang lebih umum, ubah tahun, atau pilih sumber lain.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Pencarian baru
                  </button>
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
  return (
    <Suspense fallback={<div className="py-12 text-center text-slate-600">Memuat aplikasi...</div>}>
      <SearchResults />
    </Suspense>
  );
}
