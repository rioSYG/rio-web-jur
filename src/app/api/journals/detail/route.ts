import { NextResponse } from "next/server";

import { getJournalById } from "@/lib/journal-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Parameter id wajib diisi." }, { status: 400 });
  }

  const journal = await getJournalById(id);
  if (!journal) {
    return NextResponse.json({ error: "Jurnal tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json(journal);
}
