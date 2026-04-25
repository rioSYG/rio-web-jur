"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { useTranslation } from "@/components/TranslationProvider";
import { getJournalDetails, getAccessNote, getCategoryLabel, getSourceLabel } from "@/lib/api";
import { formatMessage } from "@/lib/i18n";
import { addNote, getNote, isBookmarked, toggleBookmark } from "@/lib/storage";
import type { Journal } from "@/types/journal";

function formatDate(value: string, locale: "id" | "en") {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function JournalDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { dict, locale } = useTranslation();
  const journalId = searchParams.get("id") || "";

  const [journal, setJournal] = useState<Journal | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  useEffect(() => {
    const loadJournal = async () => {
      if (!journalId) {
        setError(dict.detail.missingId);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getJournalDetails(journalId);
        if (!result) {
          setError(dict.detail.notFound);
          setJournal(null);
          return;
        }

        setJournal(result);
        setBookmarked(isBookmarked(journalId));
        setNote(getNote(journalId));
      } catch (detailError) {
        console.error("Error loading journal:", detailError);
        setError(detailError instanceof Error ? detailError.message : dict.detail.loadError);
      } finally {
        setIsLoading(false);
      }
    };

    void loadJournal();
  }, [dict.detail.loadError, dict.detail.missingId, dict.detail.notFound, journalId]);

  const handleToggleBookmark = async () => {
    if (!journal) {
      return;
    }

    setIsBookmarking(true);
    try {
      if (session) {
        const response = await fetch(`/api/bookmarks${bookmarked ? `/${encodeURIComponent(journal.id)}` : ""}`, {
          method: bookmarked ? "DELETE" : "POST",
          headers: bookmarked ? undefined : { "Content-Type": "application/json" },
          body: bookmarked ? undefined : JSON.stringify({ ...journal, notes: note }),
        });

        if (!response.ok) {
          throw new Error("Bookmark request failed");
        }
      } else {
        toggleBookmark({
          ...journal,
          bookmarkedAt: new Date().toISOString(),
          notes: note,
        });
      }

      setBookmarked((current) => !current);
    } catch (bookmarkError) {
      console.error("Bookmark error:", bookmarkError);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleSaveNote = async () => {
    if (!journalId) {
      return;
    }

    setIsSavingNote(true);
    addNote(journalId, note);

    if (session && bookmarked) {
      try {
        await fetch(`/api/bookmarks/${encodeURIComponent(journalId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: note }),
        });
      } catch (noteError) {
        console.error("Note sync error:", noteError);
      }
    }

    window.setTimeout(() => setIsSavingNote(false), 400);
  };

  if (isLoading) {
    return <div className="py-16 text-center text-slate-600">{dict.common.loadingDetail}</div>;
  }

  if (error || !journal) {
    return (
      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{dict.detail.unavailableTitle}</h1>
        <p className="mt-3 text-sm text-slate-600">{error || dict.detail.unavailableDesc}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {dict.detail.backToSearch}
        </button>
      </div>
    );
  }

  const sourceLabel = getSourceLabel(journal.source, locale);
  const categoryLabel = getCategoryLabel(journal.category, locale);
  const accessNote = getAccessNote(journal, locale) || dict.detail.availabilityFallback;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
      >
        {dict.common.back}
      </button>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 px-8 py-10 text-white">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-100">
              {sourceLabel}
            </span>
            {journal.journal && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                {journal.journal}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">{journal.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{journal.authors.join(", ")}</p>
          <p className="mt-2 text-sm text-slate-400">
            {formatMessage(dict.detail.publishedOn, {
              date: formatDate(journal.publishedDate, locale),
            })}
          </p>
        </div>

        <div className="grid gap-8 px-8 py-8 lg:grid-cols-[minmax(0,2fr),320px]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">{dict.detail.abstractTitle}</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
                {journal.abstract || dict.detail.abstractFallback}
              </p>
            </section>

            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-lg font-semibold text-amber-950">{dict.detail.notesTitle}</h2>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={dict.detail.notesPlaceholder}
                className="mt-4 h-52 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              />
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="mt-4 rounded-xl bg-amber-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingNote ? dict.detail.savingNote : dict.detail.saveNote}
              </button>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{dict.detail.infoTitle}</h2>
              <dl className="mt-4 space-y-4 text-sm text-slate-700">
                <div>
                  <dt className="font-medium text-slate-500">{dict.detail.doiOrId}</dt>
                  <dd className="mt-1 break-all rounded-xl bg-white px-3 py-2">{journal.doi || journal.id}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">{dict.detail.availability}</dt>
                  <dd className="mt-1">{accessNote}</dd>
                </div>
                {categoryLabel && (
                  <div>
                    <dt className="font-medium text-slate-500">{dict.detail.category}</dt>
                    <dd className="mt-1">{categoryLabel}</dd>
                  </div>
                )}
              </dl>
            </section>

            <div className="space-y-3">
              <a
                href={journal.fullTextUrl || journal.landingUrl || journal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl bg-slate-900 px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {dict.detail.openSource}
              </a>

              {journal.pdfUrl && (
                <a
                  href={journal.pdfUrl}
                  className="block rounded-2xl bg-red-50 px-5 py-4 text-center text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  {dict.detail.sourcePdf}
                </a>
              )}

              <a
                href={journal.exportPdfUrl}
                className="block rounded-2xl bg-blue-50 px-5 py-4 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                {dict.detail.exportPdf}
              </a>

              <a
                href={journal.exportDocxUrl}
                className="block rounded-2xl bg-emerald-50 px-5 py-4 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                {dict.detail.exportDocx}
              </a>

              <button
                type="button"
                onClick={handleToggleBookmark}
                disabled={isBookmarking}
                className={`block w-full rounded-2xl px-5 py-4 text-sm font-semibold transition ${
                  bookmarked
                    ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {bookmarked ? dict.detail.bookmarkSaved : dict.detail.saveBookmark}
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default function JournalDetailPage() {
  const { dict } = useTranslation();

  return (
    <Suspense fallback={<div className="py-16 text-center text-slate-600">{dict.common.loadingDetail}</div>}>
      <JournalDetailContent />
    </Suspense>
  );
}
