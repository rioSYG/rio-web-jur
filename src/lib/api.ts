import type { Journal, JournalCountry, JournalSource, SearchFilters, SearchResult } from "@/types/journal";
import type { Locale } from "@/lib/i18n";

type LocalizedLabel = {
  en: string;
  id: string;
};

const categoryLabels: Record<string, LocalizedLabel> = {
  All: { id: "Semua kategori", en: "All categories" },
  "Computer Science": { id: "Ilmu Komputer", en: "Computer Science" },
  Medicine: { id: "Kedokteran", en: "Medicine" },
  Physics: { id: "Fisika", en: "Physics" },
  Biology: { id: "Biologi", en: "Biology" },
  Mathematics: { id: "Matematika", en: "Mathematics" },
  Economics: { id: "Ekonomi", en: "Economics" },
  "Indonesian Journal": { id: "Jurnal Indonesia", en: "Indonesian Journal" },
  General: { id: "Umum", en: "General" },
  Science: { id: "Sains", en: "Science" },
};

const sourceLabels: Record<string, LocalizedLabel> = {
  all: { id: "Semua sumber", en: "All sources" },
  crossref: { id: "Crossref", en: "Crossref" },
  arxiv: { id: "arXiv", en: "arXiv" },
  pubmed: { id: "PubMed", en: "PubMed" },
  garuda: { id: "GARUDA (Indonesia)", en: "GARUDA (Indonesia)" },
  sinta: { id: "DOAJ Indonesia (Sinta)", en: "DOAJ Indonesia (Sinta)" },
};

const countryLabels: Record<JournalCountry, LocalizedLabel> = {
  all: { id: "Semua negara", en: "All countries" },
  id: { id: "Indonesia", en: "Indonesia" },
  global: { id: "Internasional", en: "International" },
};

const accessNoteLabels = {
  arxiv: {
    id: "PDF tersedia langsung dari arXiv.",
    en: "PDF is available directly from arXiv.",
  },
  crossrefFullText: {
    id: "PDF tersedia langsung dari sumber open-access.",
    en: "PDF is available directly from the open-access source.",
  },
  crossrefLanding: {
    id: "Buka halaman DOI/publisher untuk melihat akses penuh yang tersedia.",
    en: "Open the DOI or publisher page to check the available full-text access.",
  },
  pubmedFullText: {
    id: "PubMed Central menyediakan halaman full text terbuka.",
    en: "PubMed Central provides an open full-text page.",
  },
  pubmedAbstract: {
    id: "PubMed menyediakan abstrak. Full text tergantung jurnal penerbit.",
    en: "PubMed provides the abstract. Full text depends on the publisher journal.",
  },
  garuda: {
    id: "Artikel tersedia melalui portal GARUDA Kemdikbud.",
    en: "The article is available through the GARUDA Kemdikbud portal.",
  },
  sintaFullText: {
    id: "Full text tersedia melalui DOAJ.",
    en: "Full text is available through DOAJ.",
  },
  sintaLanding: {
    id: "Artikel terindeks DOAJ. Buka halaman jurnal untuk akses penuh.",
    en: "The article is indexed by DOAJ. Open the journal page for full access.",
  },
};

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
    country: filters.country,
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

export function getCategories(locale: Locale): Array<{ value: string; label: string }> {
  return Object.entries(categoryLabels)
    .filter(([value]) => value !== "All")
    .map(([value, label]) => ({
      value,
      label: label[locale],
    }));
}

export function getCategoryLabel(category: string | undefined, locale: Locale) {
  if (!category) {
    return "";
  }

  return categoryLabels[category]?.[locale] || category;
}

export function getSources(locale: Locale): Array<{ id: JournalSource; name: string; country?: "id" }> {
  return [
    { id: "all", name: sourceLabels.all[locale] },
    { id: "crossref", name: sourceLabels.crossref[locale] },
    { id: "arxiv", name: sourceLabels.arxiv[locale] },
    { id: "pubmed", name: sourceLabels.pubmed[locale] },
    { id: "garuda", name: sourceLabels.garuda[locale], country: "id" },
    { id: "sinta", name: sourceLabels.sinta[locale], country: "id" },
  ];
}

export function getSourceLabel(source: string, locale: Locale) {
  return sourceLabels[source]?.[locale] || source;
}

export function getCountries(locale: Locale): Array<{ id: JournalCountry; name: string; icon: string }> {
  return [
    { id: "all", name: countryLabels.all[locale], icon: "All" },
    { id: "id", name: countryLabels.id[locale], icon: "ID" },
    { id: "global", name: countryLabels.global[locale], icon: "GL" },
  ];
}

export function getCountryLabel(country: JournalCountry, locale: Locale) {
  return countryLabels[country][locale];
}

export function getAccessNote(journal: Pick<Journal, "source" | "availability" | "accessNote">, locale: Locale) {
  if (journal.source === "arxiv") {
    return accessNoteLabels.arxiv[locale];
  }

  if (journal.source === "crossref") {
    return journal.availability === "full-text"
      ? accessNoteLabels.crossrefFullText[locale]
      : accessNoteLabels.crossrefLanding[locale];
  }

  if (journal.source === "pubmed") {
    return journal.availability === "full-text"
      ? accessNoteLabels.pubmedFullText[locale]
      : accessNoteLabels.pubmedAbstract[locale];
  }

  if (journal.source === "garuda") {
    return accessNoteLabels.garuda[locale];
  }

  if (journal.source === "sinta") {
    return journal.availability === "full-text"
      ? accessNoteLabels.sintaFullText[locale]
      : accessNoteLabels.sintaLanding[locale];
  }

  return journal.accessNote || "";
}
