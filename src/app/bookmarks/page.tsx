"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import JournalCard from "@/components/JournalCard";
import { exportBookmarks, getBookmarkedJournals } from "@/lib/storage";
import type { BookmarkedJournal } from "@/types/journal";

export default function BookmarksPage() {
  const { status } = useSession();
  const [bookmarks, setBookmarks] = useState<BookmarkedJournal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState<"json" | "csv" | "bibtex" | "pdf">("json");

  const loadBookmarks = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);

    try {
      if (status === "authenticated") {
        const response = await fetch("/api/bookmarks", { cache: "no-store" });
        if (response.ok) {
          const data = (await response.json()) as BookmarkedJournal[];
          setBookmarks(data);
        }
      } else if (status !== "loading") {
        setBookmarks(getBookmarkedJournals());
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      if (status !== "authenticated") {
        setBookmarks(getBookmarkedJournals());
      }
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBookmarks();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadBookmarks]);

  const handleExport = () => {
    if (bookmarks.length === 0) {
      window.alert("Belum ada bookmark untuk diekspor.");
      return;
    }

    if (exportFormat === "pdf") {
      window.print();
      return;
    }

    const content = exportBookmarks(exportFormat, bookmarks);
    const blob = new Blob([content], {
      type: exportFormat === "json" ? "application/json" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bookmarks.${exportFormat}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || status === "loading") {
    return <div className="py-12 text-center text-slate-600">Memuat bookmark...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Bookmark saya</h1>
            <p className="mt-2 text-sm text-slate-600">
              {bookmarks.length} jurnal tersimpan {status === "authenticated" ? "di akun Anda." : "di perangkat ini."}
            </p>
            {status !== "authenticated" && (
              <p className="mt-2 text-sm text-slate-500">
                Login jika Anda ingin menyimpan bookmark ke database dan sinkron antar sesi.
              </p>
            )}
          </div>

          {status !== "authenticated" && (
            <p className="text-sm text-slate-500">
              Gunakan tombol login di navbar jika ingin menyimpan bookmark ke database cloud.
            </p>
          )}
        </div>
      </div>

      {bookmarks.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <label className="block text-sm text-slate-700">
              <span className="mb-2 block font-medium">Format ekspor</span>
              <select
                value={exportFormat}
                onChange={(event) => setExportFormat(event.target.value as typeof exportFormat)}
                className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="bibtex">BibTeX</option>
                <option value="pdf">Cetak PDF</option>
              </select>
            </label>

            <button
              type="button"
              onClick={handleExport}
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Download {exportFormat.toUpperCase()}
            </button>

            <button
              type="button"
              onClick={() => void loadBookmarks()}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Segarkan
            </button>
          </div>
        </div>
      )}

      {bookmarks.length > 0 ? (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => (
            <JournalCard key={bookmark.id} journal={bookmark} onBookmarkChange={() => void loadBookmarks()} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Belum ada bookmark</h2>
          <p className="mt-3 text-sm text-slate-600">
            Cari jurnal terlebih dulu, lalu simpan artikel yang ingin Anda baca ulang.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Mulai mencari
          </Link>
        </div>
      )}
    </div>
  );
}
