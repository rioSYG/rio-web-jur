"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";

import { addBookmark, isBookmarked, removeBookmark } from "@/lib/storage";
import type { Journal } from "@/types/journal";

interface JournalCardProps {
  journal: Journal;
  onBookmarkChange?: () => void;
  isInitialBookmarked?: boolean;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export default function JournalCard({
  journal,
  onBookmarkChange,
  isInitialBookmarked,
}: JournalCardProps) {
  const { data: session } = useSession();
  const [bookmarked, setBookmarked] = useState(isInitialBookmarked ?? isBookmarked(journal.id));
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleBookmark = async () => {
    if (isUpdating) {
      return;
    }

    setIsUpdating(true);

    try {
      if (session) {
        const response = await fetch(`/api/bookmarks${bookmarked ? `/${encodeURIComponent(journal.id)}` : ""}`, {
          method: bookmarked ? "DELETE" : "POST",
          headers: bookmarked ? undefined : { "Content-Type": "application/json" },
          body: bookmarked ? undefined : JSON.stringify(journal),
        });

        if (!response.ok) {
          throw new Error("Bookmark request failed");
        }
      } else if (bookmarked) {
        removeBookmark(journal.id);
      } else {
        addBookmark({
          ...journal,
          bookmarkedAt: new Date().toISOString(),
        });
      }

      setBookmarked((current) => !current);
      onBookmarkChange?.();
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {journal.source}
            </span>
            {journal.category && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {journal.category}
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {formatDate(journal.publishedDate)}
            </span>
          </div>

          <h3 className="text-xl font-semibold text-slate-900">
            <Link href={`/detail?id=${encodeURIComponent(journal.id)}`} className="transition hover:text-blue-700">
              {journal.title}
            </Link>
          </h3>

          <p className="mt-3 text-sm text-slate-600">
            {journal.authors.slice(0, 4).join(", ")}
            {journal.authors.length > 4 ? ` dan ${journal.authors.length - 4} penulis lainnya` : ""}
          </p>

          <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-700">{journal.abstract}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {journal.journal && <span>{journal.journal}</span>}
            {typeof journal.citations === "number" && <span>{journal.citations} sitasi</span>}
            {journal.accessNote && <span>{journal.accessNote}</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:w-72 lg:flex-col">
          <Link
            href={`/detail?id=${encodeURIComponent(journal.id)}`}
            className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Lihat detail
          </Link>

          <a
            href={journal.fullTextUrl || journal.landingUrl || journal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Buka sumber
          </a>

          {journal.pdfUrl && (
            <a
              href={journal.pdfUrl}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 transition hover:bg-red-100"
            >
              Unduh PDF sumber
            </a>
          )}

          <a
            href={journal.exportPdfUrl}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700 transition hover:bg-blue-100"
          >
            Ekspor PDF
          </a>

          <a
            href={journal.exportDocxUrl}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            Ekspor DOCX
          </a>

          <button
            type="button"
            onClick={toggleBookmark}
            disabled={isUpdating}
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
              bookmarked
                ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {bookmarked ? "Tersimpan" : "Simpan bookmark"}
          </button>
        </div>
      </div>
    </article>
  );
}
