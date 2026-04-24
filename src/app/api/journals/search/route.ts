import { NextResponse } from "next/server";

import { searchJournalIndex } from "@/lib/journal-service";
import type { SearchFilters } from "@/types/journal";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currentYear = new Date().getFullYear();

  const filters: SearchFilters = {
    query: searchParams.get("q") || "",
    yearFrom: Number(searchParams.get("from") || currentYear - 5),
    yearTo: Number(searchParams.get("to") || currentYear),
    source: (searchParams.get("source") as SearchFilters["source"]) || "all",
    category: searchParams.get("category") || undefined,
    sortBy: (searchParams.get("sort") as SearchFilters["sortBy"]) || "relevance",
    pageSize: Number(searchParams.get("pageSize") || 10),
    page: Number(searchParams.get("page") || 1),
  };

  try {
    const result = await searchJournalIndex(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Search route error:", error);
    return NextResponse.json(
      {
        journals: [],
        total: 0,
        page: filters.page,
        pageSize: filters.pageSize,
        totalPages: 0,
        error: "Pencarian jurnal gagal dijalankan.",
      },
      { status: 500 }
    );
  }
}
