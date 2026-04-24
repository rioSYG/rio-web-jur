import type { Journal, SearchFilters, SearchResult } from "@/types/journal";

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Permintaan gagal diproses.";
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Ignore JSON parsing errors and keep the fallback message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function searchJournals(filters: SearchFilters): Promise<SearchResult> {
  const params = new URLSearchParams({
    q: filters.query,
    from: String(filters.yearFrom),
    to: String(filters.yearTo),
    source: filters.source,
    sort: filters.sortBy,
    pageSize: String(filters.pageSize),
    page: String(filters.page),
  });

  if (filters.category) {
    params.set("category", filters.category);
  }

  const response = await fetch(`/api/journals/search?${params.toString()}`, {
    cache: "no-store",
  });

  return readJson<SearchResult>(response);
}

export async function getJournalDetails(id: string): Promise<Journal | null> {
  const response = await fetch(`/api/journals/detail?id=${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  return readJson<Journal>(response);
}

export function getCategories(): string[] {
  return ["All", "Computer Science", "Medicine", "Physics", "Biology", "Mathematics", "Economics", "General"];
}

export function getSources(): Array<{ id: string; name: string }> {
  return [
    { id: "all", name: "Semua Sumber" },
    { id: "pubmed", name: "PubMed" },
    { id: "crossref", name: "Crossref" },
    { id: "arxiv", name: "arXiv" },
  ];
}
