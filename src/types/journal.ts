export type JournalSource = "all" | "pubmed" | "crossref" | "arxiv" | "google";
export type JournalAvailability = "full-text" | "publisher-page" | "abstract-only";

export interface SearchFilters {
  query: string;
  yearFrom: number;
  yearTo: number;
  source: JournalSource;
  category?: string;
  sortBy: "relevance" | "date" | "citations";
  pageSize: number;
  page: number;
}

export interface Journal {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedDate: string;
  source: string;
  citations?: number;
  doi?: string;
  pmid?: string;
  arxivId?: string;
  url: string;
  keywords?: string[];
  journal?: string;
  category?: string;
  landingUrl?: string;
  fullTextUrl?: string;
  sourcePdfUrl?: string;
  pdfUrl?: string;
  exportPdfUrl?: string;
  exportDocxUrl?: string;
  availability?: JournalAvailability;
  accessNote?: string;
}

export interface SearchResult {
  journals: Journal[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BookmarkedJournal extends Journal {
  bookmarkedAt: string;
  notes?: string;
}

export interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilters;
  timestamp: string;
  resultCount: number;
}
