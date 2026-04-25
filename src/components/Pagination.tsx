"use client";

import { useTranslation } from "@/components/TranslationProvider";
import { formatMessage } from "@/lib/i18n";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: PaginationProps) {
  const { dict } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  const pages: Array<number | string> = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    pages.push(1);
  }
  if (start > 2) {
    pages.push("...");
  }
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  if (end < totalPages - 1) {
    pages.push("...");
  }
  if (end < totalPages) {
    pages.push(totalPages);
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {dict.pagination.previous}
      </button>

      {pages.map((page, index) => (
        <button
          key={`${page}-${index}`}
          type="button"
          onClick={() => (typeof page === "number" ? onPageChange(page) : undefined)}
          disabled={page === "..." || isLoading}
          className={`rounded-xl px-4 py-2 text-sm transition ${
            page === currentPage
              ? "bg-slate-900 text-white"
              : page === "..."
                ? "cursor-default text-slate-400"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {dict.pagination.next}
      </button>

      <span className="ml-2 text-sm text-slate-500">
        {formatMessage(dict.pagination.pageOf, { current: currentPage, total: totalPages })}
      </span>
    </div>
  );
}
