import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const cloudBookmarksEnabled = Boolean(process.env.TURSO_DATABASE_URL);

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!cloudBookmarksEnabled) {
    return NextResponse.json({ error: "Cloud bookmarks are disabled." }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deleted = await prisma.bookmark.deleteMany({
      where: {
        userId: session.user.id,
        OR: [{ id }, { journalId: id }],
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Bookmark tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!cloudBookmarksEnabled) {
    return NextResponse.json({ error: "Cloud bookmarks are disabled." }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { notes } = (await request.json()) as { notes?: string };

  try {
    const updated = await prisma.bookmark.updateMany({
      where: {
        userId: session.user.id,
        OR: [{ id }, { journalId: id }],
      },
      data: {
        notes: notes || "",
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Bookmark tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating bookmark:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
