import type { BookmarkedJournal } from "@/types/journal";

const BOOKMARKS_KEY = "journal_search_bookmarks";
const NOTES_KEY = "journal_search_notes";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
  }
}

function getNotesMap() {
  return readJson<Record<string, string>>(NOTES_KEY, {});
}

export function getBookmarkedJournals(): BookmarkedJournal[] {
  return readJson<BookmarkedJournal[]>(BOOKMARKS_KEY, []);
}

export function addBookmark(journal: BookmarkedJournal): void {
  const bookmarks = getBookmarkedJournals();
  if (bookmarks.some((bookmark) => bookmark.id === journal.id)) {
    return;
  }

  bookmarks.push({
    ...journal,
    notes: journal.notes || getNote(journal.id),
  });
  writeJson(BOOKMARKS_KEY, bookmarks);
}

export function removeBookmark(id: string): void {
  const bookmarks = getBookmarkedJournals().filter((bookmark) => bookmark.id !== id);
  writeJson(BOOKMARKS_KEY, bookmarks);
}

export function isBookmarked(id: string): boolean {
  return getBookmarkedJournals().some((bookmark) => bookmark.id === id);
}

export function updateBookmarkNotes(id: string, notes: string): void {
  const bookmarks = getBookmarkedJournals().map((bookmark) =>
    bookmark.id === id ? { ...bookmark, notes } : bookmark
  );
  const notesMap = getNotesMap();
  notesMap[id] = notes;

  writeJson(BOOKMARKS_KEY, bookmarks);
  writeJson(NOTES_KEY, notesMap);
}

export const addNote = updateBookmarkNotes;

export function getNote(id: string): string {
  const bookmark = getBookmarkedJournals().find((item) => item.id === id);
  if (bookmark?.notes) {
    return bookmark.notes;
  }

  return getNotesMap()[id] || "";
}

export function toggleBookmark(journal: BookmarkedJournal): void {
  if (isBookmarked(journal.id)) {
    removeBookmark(journal.id);
    return;
  }

  addBookmark(journal);
}

export function exportBookmarks(
  format: "json" | "csv" | "bibtex" | "pdf",
  data?: BookmarkedJournal[]
): string {
  const bookmarks = data || getBookmarkedJournals();

  if (format === "json") {
    return JSON.stringify(bookmarks, null, 2);
  }

  if (format === "csv") {
    const headers = ["Title", "Authors", "Published Date", "Source", "URL"];
    const rows = bookmarks.map((bookmark) => [
      `"${bookmark.title.replace(/"/g, '""')}"`,
      `"${bookmark.authors.join("; ").replace(/"/g, '""')}"`,
      bookmark.publishedDate,
      bookmark.source,
      bookmark.fullTextUrl || bookmark.url,
    ]);

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  }

  if (format === "bibtex") {
    return bookmarks
      .map((bookmark, index) => {
        const year = new Date(bookmark.publishedDate).getFullYear();
        return `@article{journal${index},
  title={${bookmark.title}},
  author={${bookmark.authors.join(" and ")}},
  year={${year}},
  url={${bookmark.fullTextUrl || bookmark.url}}
}`;
      })
      .join("\n\n");
  }

  return "";
}
