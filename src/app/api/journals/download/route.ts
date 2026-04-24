import { NextResponse } from "next/server";

import { createExportFilename, generateJournalDocx, generateJournalPdf } from "@/lib/export";
import { getJournalById } from "@/lib/journal-service";

export const dynamic = "force-dynamic";

function isSafeRemoteUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const format = searchParams.get("format");

  if (!id || !format) {
    return NextResponse.json({ error: "Parameter id dan format wajib diisi." }, { status: 400 });
  }

  const journal = await getJournalById(id);
  if (!journal) {
    return NextResponse.json({ error: "Jurnal tidak ditemukan." }, { status: 404 });
  }

  if (format === "source-pdf") {
    const sourcePdfUrl = journal.sourcePdfUrl;
    if (!sourcePdfUrl || !isSafeRemoteUrl(sourcePdfUrl)) {
      return NextResponse.json(
        { error: "PDF asli tidak tersedia dari sumber jurnal ini." },
        { status: 404 }
      );
    }

    const upstream = await fetch(sourcePdfUrl, {
      headers: {
        "user-agent": "Journal Search Hub/1.0",
      },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "Gagal mengambil PDF dari sumber." }, { status: 502 });
    }

    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/pdf",
        "content-disposition": `attachment; filename="${createExportFilename(journal, "pdf")}"`,
      },
    });
  }

  if (format === "pdf") {
    const pdfBytes = await generateJournalPdf(journal);
    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${createExportFilename(journal, "pdf")}"`,
      },
    });
  }

  if (format === "docx") {
    const docxBuffer = await generateJournalDocx(journal);
    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": `attachment; filename="${createExportFilename(journal, "docx")}"`,
      },
    });
  }

  return NextResponse.json({ error: "Format download tidak didukung." }, { status: 400 });
}
