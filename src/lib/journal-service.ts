import "server-only";

import type { Journal, SearchFilters, SearchResult } from "@/types/journal";

const REQUEST_TIMEOUT_MS = 12000;
const CROSSREF_MAILTO = process.env.CROSSREF_MAILTO || process.env.NEXT_PUBLIC_CROSSREF_EMAIL;
const SOURCE_FETCH_MULTIPLIER = 3;

// ─── GARUDA (garuda.kemdikbud.go.id) types ────────────────────────────────
type GarudaArticle = {
  id?: string | number;
  title?: string;
  author?: string | string[];
  abstract?: string;
  year?: string | number;
  journal_name?: string;
  doi?: string;
  url?: string;
  volume?: string;
  issue?: string;
  // GARUDA JSON v1 also uses these names:
  judul?: string;
  penulis?: string;
  abstrak?: string;
  nama_jurnal?: string;
  tautan?: string;
};

// ─── DOAJ types ───────────────────────────────────────────────────────────
type DoajArticle = {
  id?: string;
  bibjson?: {
    title?: string;
    abstract?: string;
    year?: string;
    journal?: { title?: string; country_code?: string };
    author?: Array<{ name?: string }>;
    identifier?: Array<{ type?: string; id?: string }>;
    link?: Array<{ type?: string; url?: string }>;
    subject?: Array<{ term?: string }>;
    keywords?: string[];
  };
};

const fallbackJournals: Journal[] = [
  {
    id: "10.48550/arXiv.1706.03762",
    title: "Attention Is All You Need",
    authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar"],
    abstract:
      "The Transformer architecture uses attention mechanisms to model sequence transduction without recurrent networks.",
    publishedDate: "2017-06-12",
    source: "arxiv",
    arxivId: "1706.03762",
    url: "https://arxiv.org/abs/1706.03762",
    landingUrl: "https://arxiv.org/abs/1706.03762",
    fullTextUrl: "https://arxiv.org/abs/1706.03762",
    sourcePdfUrl: "https://arxiv.org/pdf/1706.03762.pdf",
    journal: "arXiv",
    category: "Computer Science",
    availability: "full-text",
    accessNote: "PDF tersedia langsung dari arXiv.",
  },
];

type SourceResult = {
  journals: Journal[];
  total: number;
};

type CrossrefWork = {
  DOI?: string;
  URL?: string;
  title?: string[];
  author?: Array<{ given?: string; family?: string; name?: string }>;
  abstract?: string;
  published?: { "date-parts"?: number[][] };
  created?: { "date-parts"?: number[][] };
  subject?: string[];
  "container-title"?: string[];
  link?: Array<{ URL?: string; "content-type"?: string; "content-version"?: string }>;
  resource?: { primary?: { URL?: string } };
  license?: Array<{ URL?: string }>;
  "is-referenced-by-count"?: number;
};

type PubMedSummary = {
  uid?: string;
  title?: string;
  pubdate?: string;
  source?: string;
  authors?: Array<{ name?: string }>;
};

function buildExportUrl(id: string, format: "pdf" | "docx") {
  return `/api/journals/download?id=${encodeURIComponent(id)}&format=${format}`;
}

function buildSourcePdfUrl(id: string) {
  return `/api/journals/download?id=${encodeURIComponent(id)}&format=source-pdf`;
}

function normalizeFilters(filters: SearchFilters): SearchFilters {
  const year = new Date().getFullYear();
  const yearFrom = Number.isFinite(filters.yearFrom) ? filters.yearFrom : year - 5;
  const yearTo = Number.isFinite(filters.yearTo) ? filters.yearTo : year;

  return {
    query: filters.query.trim(),
    yearFrom: Math.min(yearFrom, yearTo),
    yearTo: Math.max(yearFrom, yearTo),
    source: filters.source || "all",
    country: filters.country || "all",
    category: filters.category?.trim() || undefined,
    sortBy: filters.sortBy || "relevance",
    pageSize: Math.min(Math.max(filters.pageSize || 10, 1), 50),
    page: Math.max(filters.page || 1, 1),
  };
}

function createAbortSignal() {
  return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
}

function cleanText(value: string | undefined | null) {
  if (!value) {
    return "";
  }

  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDateParts(value: { "date-parts"?: number[][] } | undefined) {
  const parts = value?.["date-parts"]?.[0] || [2000, 1, 1];
  return `${parts[0]}-${String(parts[1] || 1).padStart(2, "0")}-${String(parts[2] || 1).padStart(2, "0")}`;
}

function parsePubMedDate(value: string | undefined) {
  if (!value) {
    return "2000-01-01";
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  const yearMatch = value.match(/\d{4}/);
  return `${yearMatch?.[0] || "2000"}-01-01`;
}

function readTagValue(entry: string, tagName: string) {
  const match = entry.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return cleanText(match?.[1]);
}

function readAttrValue(entry: string, pattern: RegExp) {
  const match = entry.match(pattern);
  return match?.[1];
}

function extractEntries(xml: string) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => match[0]);
}

function normalizeTitleForScore(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
}

function getQueryScore(journal: Journal, query: string) {
  const normalizedQuery = normalizeTitleForScore(query);
  const haystack = `${journal.title} ${journal.abstract} ${journal.keywords?.join(" ") || ""}`.toLowerCase();
  if (!normalizedQuery) {
    return 0;
  }

  if (haystack.includes(normalizedQuery)) {
    return 3;
  }

  const words = normalizedQuery.split(" ").filter(Boolean);
  return words.reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0);
}

function sortJournals(journals: Journal[], filters: SearchFilters) {
  const sorted = [...journals];

  sorted.sort((left, right) => {
    if (filters.sortBy === "date") {
      return new Date(right.publishedDate).getTime() - new Date(left.publishedDate).getTime();
    }

    if (filters.sortBy === "citations") {
      return (right.citations || 0) - (left.citations || 0);
    }

    const scoreDelta = getQueryScore(right, filters.query) - getQueryScore(left, filters.query);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    const citationDelta = (right.citations || 0) - (left.citations || 0);
    if (citationDelta !== 0) {
      return citationDelta;
    }

    return new Date(right.publishedDate).getTime() - new Date(left.publishedDate).getTime();
  });

  return sorted;
}

function dedupeJournals(journals: Journal[]) {
  const unique = new Map<string, Journal>();

  for (const journal of journals) {
    const key = journal.doi || journal.pmid || journal.arxivId || normalizeTitleForScore(journal.title);
    if (!unique.has(key)) {
      unique.set(key, journal);
    }
  }

  return [...unique.values()];
}

function enrichJournal(journal: Journal): Journal {
  return {
    ...journal,
    landingUrl: journal.landingUrl || journal.url,
    exportPdfUrl: buildExportUrl(journal.id, "pdf"),
    exportDocxUrl: buildExportUrl(journal.id, "docx"),
    pdfUrl: journal.sourcePdfUrl ? buildSourcePdfUrl(journal.id) : undefined,
  };
}

function filterJournal(journal: Journal, filters: SearchFilters) {
  const year = new Date(journal.publishedDate).getFullYear();
  const matchesYear = year >= filters.yearFrom && year <= filters.yearTo;
  const matchesCategory = !filters.category || filters.category === "All" || journal.category === filters.category;
  return matchesYear && matchesCategory;
}

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "user-agent": `Journal Search Hub/1.0${CROSSREF_MAILTO ? ` (mailto:${CROSSREF_MAILTO})` : ""}`,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function fetchText(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "user-agent": `Journal Search Hub/1.0${CROSSREF_MAILTO ? ` (mailto:${CROSSREF_MAILTO})` : ""}`,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function mapCrossrefItem(item: CrossrefWork): Journal {
  const authors =
    item.author?.map((author) => author.name || `${author.given || ""} ${author.family || ""}`.trim()).filter(Boolean) ||
    ["Unknown"];
  const pdfLink = item.link?.find((link) => link["content-type"]?.includes("pdf"))?.URL;
  const landingUrl = item.resource?.primary?.URL || item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : "");

  return {
    id: item.DOI || landingUrl || crypto.randomUUID(),
    title: cleanText(item.title?.[0]) || "Untitled",
    authors,
    abstract: cleanText(item.abstract) || "Abstract tidak tersedia dari sumber ini.",
    publishedDate: parseDateParts(item.published || item.created),
    source: "crossref",
    citations: item["is-referenced-by-count"] || 0,
    doi: item.DOI,
    url: landingUrl,
    landingUrl,
    fullTextUrl: landingUrl,
    sourcePdfUrl: pdfLink,
    journal: cleanText(item["container-title"]?.[0]) || "Crossref",
    category: item.subject?.[0] || "General",
    keywords: item.subject || [],
    availability: pdfLink ? "full-text" : "publisher-page",
    accessNote: pdfLink
      ? "PDF tersedia langsung dari sumber open-access."
      : "Buka halaman DOI/publisher untuk melihat akses penuh yang tersedia.",
  };
}

async function searchCrossref(filters: SearchFilters): Promise<SourceResult> {
  const rows =
    filters.source === "all"
      ? filters.page * filters.pageSize * SOURCE_FETCH_MULTIPLIER
      : filters.pageSize * SOURCE_FETCH_MULTIPLIER;
  const offset = filters.source === "all" ? 0 : (filters.page - 1) * filters.pageSize;

  const params = new URLSearchParams({
    query: filters.query,
    rows: String(rows),
    offset: String(offset),
    sort: filters.sortBy === "date" ? "published" : "relevance",
    filter: `from-pub-date:${filters.yearFrom}-01-01,until-pub-date:${filters.yearTo}-12-31`,
  });

  const data = await fetchJson<{ message?: { items?: CrossrefWork[]; "total-results"?: number } }>(
    `https://api.crossref.org/v1/works?${params.toString()}`,
    { signal: createAbortSignal() }
  );

  const journals = (data.message?.items || []).map(mapCrossrefItem);
  return {
    journals,
    total: data.message?.["total-results"] || journals.length,
  };
}

function mapArxivEntry(entry: string): Journal {
  const id = readTagValue(entry, "id") || crypto.randomUUID();
  const arxivId = id.split("/").pop() || id;
  const pdfLink =
    readAttrValue(entry, /<link[^>]+title="pdf"[^>]+href="([^"]+)"/i) || `https://arxiv.org/pdf/${arxivId}.pdf`;
  const categories = [...entry.matchAll(/<category[^>]+term="([^"]+)"/g)].map((match) => match[1]);

  return {
    id,
    title: readTagValue(entry, "title") || "Untitled",
    authors: [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)].map((match) => cleanText(match[1])),
    abstract: readTagValue(entry, "summary") || "Abstract tidak tersedia dari arXiv.",
    publishedDate: (readTagValue(entry, "published") || "2000-01-01").slice(0, 10),
    source: "arxiv",
    arxivId,
    url: `https://arxiv.org/abs/${arxivId}`,
    landingUrl: `https://arxiv.org/abs/${arxivId}`,
    fullTextUrl: `https://arxiv.org/abs/${arxivId}`,
    sourcePdfUrl: pdfLink,
    journal: "arXiv",
    category: categories[0] || "Science",
    keywords: categories,
    availability: "full-text",
    accessNote: "PDF tersedia langsung dari arXiv.",
  };
}

async function searchArxiv(filters: SearchFilters): Promise<SourceResult> {
  const maxResults =
    filters.source === "all"
      ? filters.page * filters.pageSize * SOURCE_FETCH_MULTIPLIER
      : filters.pageSize * SOURCE_FETCH_MULTIPLIER;
  const start = filters.source === "all" ? 0 : (filters.page - 1) * filters.pageSize;

  const xml = await fetchText(
    `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(filters.query)}&start=${start}&max_results=${maxResults}&sortBy=${
      filters.sortBy === "date" ? "submittedDate" : "relevance"
    }&sortOrder=descending`,
    { signal: createAbortSignal() }
  );

  const totalMatch = xml.match(/<opensearch:totalResults>(\d+)<\/opensearch:totalResults>/);
  const journals = extractEntries(xml).map(mapArxivEntry);

  return {
    journals,
    total: Number(totalMatch?.[1] || journals.length),
  };
}

async function fetchPubMedAbstract(id: string) {
  try {
    const xml = await fetchText(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${id}&retmode=xml`,
      { signal: createAbortSignal() }
    );

    const abstract = [...xml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)]
      .map((match) => cleanText(match[1]))
      .filter(Boolean)
      .join("\n\n");
    const pmcId = readAttrValue(xml, /<ArticleId IdType="pmc">([^<]+)<\/ArticleId>/i);

    return {
      abstract: abstract || "Abstract tidak tersedia dari PubMed.",
      pmcId,
    };
  } catch {
    return {
      abstract: "Abstract tidak tersedia dari PubMed.",
      pmcId: undefined,
    };
  }
}

function mapPubMedItem(item: PubMedSummary, abstract: string, pmcId?: string): Journal {
  const pmid = item.uid || "";
  const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
  const pmcUrl = pmcId ? `https://pmc.ncbi.nlm.nih.gov/articles/${pmcId}/` : undefined;

  return {
    id: `pubmed-${pmid}`,
    title: cleanText(item.title) || "Untitled",
    authors: item.authors?.map((author) => cleanText(author.name) || "Unknown").filter(Boolean) || ["Unknown"],
    abstract,
    publishedDate: parsePubMedDate(item.pubdate),
    source: "pubmed",
    pmid,
    url: pmcUrl || pubmedUrl,
    landingUrl: pubmedUrl,
    fullTextUrl: pmcUrl || pubmedUrl,
    journal: cleanText(item.source) || "PubMed",
    category: "Medicine",
    availability: pmcUrl ? "full-text" : "abstract-only",
    accessNote: pmcUrl
      ? "PubMed Central menyediakan halaman full text terbuka."
      : "PubMed menyediakan abstrak. Full text tergantung jurnal penerbit.",
  };
}

async function searchPubMed(filters: SearchFilters): Promise<SourceResult> {
  const retmax =
    filters.source === "all"
      ? filters.page * filters.pageSize * SOURCE_FETCH_MULTIPLIER
      : filters.pageSize * SOURCE_FETCH_MULTIPLIER;
  const retstart = filters.source === "all" ? 0 : (filters.page - 1) * filters.pageSize;
  const params = new URLSearchParams({
    db: "pubmed",
    term: filters.query,
    retmode: "json",
    retmax: String(retmax),
    retstart: String(retstart),
    datetype: "pdat",
    mindate: String(filters.yearFrom),
    maxdate: String(filters.yearTo),
    sort: filters.sortBy === "date" ? "pub date" : "relevance",
  });

  const searchData = await fetchJson<{ esearchresult?: { idlist?: string[]; count?: string } }>(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params.toString()}`,
    { signal: createAbortSignal() }
  );
  const ids = searchData.esearchresult?.idlist || [];

  if (ids.length === 0) {
    return { journals: [], total: 0 };
  }

  const summaryData = await fetchJson<{ result?: Record<string, PubMedSummary> }>(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`,
    { signal: createAbortSignal() }
  );

  const journals = await Promise.all(
    ids.map(async (id) => {
      const item = summaryData.result?.[id];
      const details = await fetchPubMedAbstract(id);
      return mapPubMedItem(item || { uid: id }, details.abstract, details.pmcId);
    })
  );

  return {
    journals,
    total: Number(searchData.esearchresult?.count || journals.length),
  };
}

// ─── GARUDA (garuda.kemdikbud.go.id) ─────────────────────────────────────
function mapGarudaArticle(item: GarudaArticle): Journal {
  const title = cleanText(item.title || item.judul) || "Untitled";
  const rawAuthors = item.author || item.penulis;
  const authors: string[] = Array.isArray(rawAuthors)
    ? rawAuthors.map(cleanText).filter(Boolean)
    : rawAuthors
    ? cleanText(rawAuthors)
        .split(/[;,]/)  
        .map((s) => s.trim())
        .filter(Boolean)
    : ["Unknown"];
  const year = String(item.year || new Date().getFullYear());
  const doi = item.doi;
  const landingUrl = item.url || item.tautan || (doi ? `https://doi.org/${doi}` : "");
  return {
    id: doi || `garuda-${String(item.id || crypto.randomUUID())}`,
    title,
    authors,
    abstract: cleanText(item.abstract || item.abstrak) || "Abstrak tidak tersedia dari GARUDA.",
    publishedDate: `${year}-01-01`,
    source: "garuda",
    doi,
    url: landingUrl,
    landingUrl,
    fullTextUrl: landingUrl,
    journal: cleanText(item.journal_name || item.nama_jurnal) || "GARUDA",
    category: "Indonesian Journal",
    availability: "publisher-page",
    accessNote: "Artikel tersedia melalui portal GARUDA Kemdikbud.",
  };
}

async function searchGaruda(filters: SearchFilters): Promise<SourceResult> {
  // GARUDA API v1: https://garuda.kemdikbud.go.id/api/article?keyword=...&page=...
  const page = filters.source === "all" ? 1 : filters.page;
  const params = new URLSearchParams({
    keyword: filters.query,
    page: String(page),
  });

  try {
    const data = await fetchJson<{ data?: GarudaArticle[]; total?: number } | GarudaArticle[]>(
      `https://garuda.kemdikbud.go.id/api/article?${params.toString()}`,
      { signal: createAbortSignal() }
    );

    const items: GarudaArticle[] = Array.isArray(data)
      ? data
      : (data as { data?: GarudaArticle[] }).data || [];

    const total: number = Array.isArray(data)
      ? items.length
      : (data as { total?: number }).total ?? items.length;

    const journals = items
      .map(mapGarudaArticle)
      .filter((j) => {
        const y = new Date(j.publishedDate).getFullYear();
        return y >= filters.yearFrom && y <= filters.yearTo;
      });

    return { journals, total };
  } catch {
    return { journals: [], total: 0 };
  }
}

// ─── DOAJ – Indonesia filter (used for "sinta" source) ────────────────────
function mapDoajArticle(item: DoajArticle): Journal {
  const bib = item.bibjson || {};
  const doi = bib.identifier?.find((i) => i.type === "doi")?.id;
  const fullTextLink = bib.link?.find((l) => l.type === "fulltext")?.url;
  const landingUrl = fullTextLink || (doi ? `https://doi.org/${doi}` : "");
  const year = bib.year || "2000";
  return {
    id: doi || `doaj-${item.id || crypto.randomUUID()}`,
    title: cleanText(bib.title) || "Untitled",
    authors: bib.author?.map((a) => cleanText(a.name) || "Unknown").filter(Boolean) || ["Unknown"],
    abstract: cleanText(bib.abstract) || "Abstrak tidak tersedia dari DOAJ.",
    publishedDate: `${year}-01-01`,
    source: "sinta",
    doi,
    url: landingUrl,
    landingUrl,
    fullTextUrl: fullTextLink || landingUrl,
    sourcePdfUrl: undefined,
    journal: cleanText(bib.journal?.title) || "DOAJ Indonesia",
    category: bib.subject?.[0]?.term || "Indonesian Journal",
    keywords: bib.keywords || [],
    availability: fullTextLink ? "full-text" : "publisher-page",
    accessNote: fullTextLink
      ? "Full text tersedia melalui DOAJ."
      : "Artikel terindeks DOAJ – buka halaman jurnal untuk akses penuh.",
  };
}

async function searchDoajIndonesia(filters: SearchFilters): Promise<SourceResult> {
  // DOAJ API v2 – filter by Indonesia country code
  const pageSize = filters.source === "all"
    ? filters.pageSize * SOURCE_FETCH_MULTIPLIER
    : filters.pageSize;
  const page = filters.source === "all" ? 1 : filters.page;

  // DOAJ uses Lucene syntax. To combine text query and field query, just write:
  // "TEXT AND bibjson.journal.country:ID"
  const rawQuery = `${filters.query} AND bibjson.journal.country:ID`;
  const encQuery = encodeURIComponent(rawQuery);
  const sortParam = filters.sortBy === "date" ? "&sort=created_date:desc" : "";
  const url = `https://doaj.org/api/v2/search/articles/${encQuery}?page=${page}&pageSize=${pageSize}${sortParam}`;

  try {
    const data = await fetchJson<{ results?: DoajArticle[]; total?: number }>(
      url,
      { signal: createAbortSignal() }
    );

    const items = data.results || [];
    const journals = items
      .map(mapDoajArticle)
      .filter((j) => {
        const y = new Date(j.publishedDate).getFullYear();
        return y >= filters.yearFrom && y <= filters.yearTo;
      });

    return { journals, total: data.total ?? journals.length };
  } catch {
    return { journals: [], total: 0 };
  }
}

export async function searchJournalIndex(rawFilters: SearchFilters): Promise<SearchResult> {
  const filters = normalizeFilters(rawFilters);

  if (!filters.query) {
    return {
      journals: [],
      total: 0,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: 0,
    };
  }

  // Decide which sources to query based on country + source filter
  type SourceKey = "crossref" | "arxiv" | "pubmed" | "garuda" | "sinta";
  let sources: SourceKey[];

  if (filters.country === "id") {
    // Indonesia mode: only GARUDA + DOAJ-Indonesia regardless of source selector
    sources = filters.source === "garuda"
      ? ["garuda"]
      : filters.source === "sinta"
      ? ["sinta"]
      : ["garuda", "sinta"];
  } else if (filters.source === "all") {
    // Global all: crossref + arxiv + pubmed (no Indonesian sources unless country=id)
    sources = ["crossref", "arxiv", "pubmed"];
  } else {
    sources = [filters.source as SourceKey];
  }

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      if (source === "crossref") return searchCrossref(filters);
      if (source === "arxiv") return searchArxiv(filters);
      if (source === "pubmed") return searchPubMed(filters);
      if (source === "garuda") return searchGaruda(filters);
      if (source === "sinta") return searchDoajIndonesia(filters);
      return { journals: [], total: 0 };
    })
  );

  let total = 0;
  let journals: Journal[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      total += result.value.total;
      journals.push(...result.value.journals);
    }
  }

  journals = dedupeJournals(journals).filter((journal) => filterJournal(journal, filters));
  journals = sortJournals(journals, filters).map(enrichJournal);

  const startIndex = (filters.page - 1) * filters.pageSize;
  const pageItems = journals.slice(startIndex, startIndex + filters.pageSize);
  const safeTotal = filters.source === "all" ? Math.max(total, journals.length) : total;

  return {
    journals: pageItems,
    total: safeTotal,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(safeTotal / filters.pageSize)),
  };
}

export async function getJournalDetails(id: string) {
  const decodedId = decodeURIComponent(id);
  const fallback = fallbackJournals.find((journal) => journal.id === decodedId);

  if (fallback) {
    return enrichJournal(fallback);
  }

  if (decodedId.startsWith("pubmed-")) {
    const pmid = decodedId.replace("pubmed-", "");
    const summaryData = await fetchJson<{ result?: Record<string, PubMedSummary> }>(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`,
      { signal: createAbortSignal() }
    );
    const item = summaryData.result?.[pmid];
    if (!item) {
      return null;
    }

    const details = await fetchPubMedAbstract(pmid);
    return enrichJournal(mapPubMedItem(item, details.abstract, details.pmcId));
  }

  const arxivIdMatch =
    decodedId.match(/arxiv\.org\/(?:abs|pdf)\/([^/?#]+)/i)?.[1] || decodedId.match(/^\d{4}\.\d{4,5}(v\d+)?$/)?.[0];
  if (arxivIdMatch) {
    const arxivId = arxivIdMatch.replace(/\.pdf$/i, "");
    const xml = await fetchText(`https://export.arxiv.org/api/query?id_list=${encodeURIComponent(arxivId)}`, {
      signal: createAbortSignal(),
    });
    const entry = extractEntries(xml)[0];
    return entry ? enrichJournal(mapArxivEntry(entry)) : null;
  }

  const crossrefData = await fetchJson<{ message?: CrossrefWork }>(
    `https://api.crossref.org/v1/works/${encodeURIComponent(decodedId)}`,
    { signal: createAbortSignal() }
  );
  if (crossrefData.message) {
    return enrichJournal(mapCrossrefItem(crossrefData.message));
  }

  return null;
}

export async function getJournalById(id: string) {
  try {
    return await getJournalDetails(id);
  } catch {
    return null;
  }
}

export function getCategories() {
  return ["All", "Computer Science", "Medicine", "Physics", "Biology", "Mathematics", "Economics", "Indonesian Journal", "General"];
}

export function getSources() {
  return [
    { id: "all", name: "Semua Sumber" },
    { id: "crossref", name: "Crossref" },
    { id: "arxiv", name: "arXiv" },
    { id: "pubmed", name: "PubMed" },
    { id: "garuda", name: "GARUDA (Indonesia)", country: "id" },
    { id: "sinta", name: "DOAJ Indonesia (Sinta)", country: "id" },
  ];
}

export function getCountries() {
  return [
    { id: "all", name: "🌍 Semua Negara" },
    { id: "id", name: "🇮🇩 Indonesia" },
    { id: "global", name: "🌐 Internasional" },
  ];
}
