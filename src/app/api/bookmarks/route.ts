import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const cloudBookmarksEnabled = Boolean(process.env.TURSO_DATABASE_URL);

function mapBookmark(bookmark: {
  id: string;
  journalId: string;
  title: string;
  authors: string;
  abstract: string;
  publishedDate: string;
  source: string;
  citations: number | null;
  doi: string | null;
  pmid: string | null;
  arxivId: string | null;
  url: string;
  keywords: string | null;
  journalName: string | null;
  category: string | null;
  notes: string | null;
  bookmarkedAt: Date;
}) {
  const safeId = bookmark.journalId;
  return {
    id: safeId,
    title: bookmark.title,
    authors: JSON.parse(bookmark.authors) as string[],
    abstract: bookmark.abstract,
    publishedDate: bookmark.publishedDate,
    source: bookmark.source,
    citations: bookmark.citations || undefined,
    doi: bookmark.doi || undefined,
    pmid: bookmark.pmid || undefined,
    arxivId: bookmark.arxivId || undefined,
    url: bookmark.url,
    landingUrl: bookmark.url,
    fullTextUrl: bookmark.url,
    exportPdfUrl: `/api/journals/download?id=${encodeURIComponent(safeId)}&format=pdf`,
    exportDocxUrl: `/api/journals/download?id=${encodeURIComponent(safeId)}&format=docx`,
    keywords: bookmark.keywords ? (JSON.parse(bookmark.keywords) as string[]) : [],
    journal: bookmark.journalName || undefined,
    category: bookmark.category || undefined,
    bookmarkedAt: bookmark.bookmarkedAt.toISOString(),
    notes: bookmark.notes || undefined,
  };
}

export async function GET() {
  if (!cloudBookmarksEnabled) {
    return NextResponse.json({ error: "Cloud bookmarks are disabled." }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.user.id },
      orderBy: { bookmarkedAt: "desc" },
    });

    return NextResponse.json(bookmarks.map(mapBookmark));
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!cloudBookmarksEnabled) {
    return NextResponse.json({ error: "Cloud bookmarks are disabled." }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const journal = await request.json();

    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_journalId: {
          userId: session.user.id,
          journalId: String(journal.id),
        },
      },
      update: {
        title: journal.title,
        authors: JSON.stringify(journal.authors || []),
        abstract: journal.abstract || "",
        publishedDate: journal.publishedDate,
        source: journal.source,
        citations: journal.citations,
        doi: journal.doi,
        pmid: journal.pmid,
        arxivId: journal.arxivId,
        url: journal.fullTextUrl || journal.landingUrl || journal.url,
        keywords: JSON.stringify(journal.keywords || []),
        journalName: journal.journal,
        category: journal.category,
        notes: journal.notes || "",
      },
      create: {
        userId: session.user.id,
        journalId: String(journal.id),
        title: journal.title,
        authors: JSON.stringify(journal.authors || []),
        abstract: journal.abstract || "",
        publishedDate: journal.publishedDate,
        source: journal.source,
        citations: journal.citations,
        doi: journal.doi,
        pmid: journal.pmid,
        arxivId: journal.arxivId,
        url: journal.fullTextUrl || journal.landingUrl || journal.url,
        keywords: JSON.stringify(journal.keywords || []),
        journalName: journal.journal,
        category: journal.category,
        notes: journal.notes || "",
      },
    });

    return NextResponse.json(mapBookmark(bookmark));
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
