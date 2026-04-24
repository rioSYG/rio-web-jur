import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";

import { Providers } from "@/components/Providers";
import { auth, signIn, signOut } from "@/lib/auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Journal Search Hub",
  description:
    "Aplikasi pencarian jurnal untuk Crossref, PubMed, dan arXiv dengan akses sumber serta ekspor PDF dan DOCX.",
  keywords: ["journal search", "pencarian jurnal", "pubmed", "arxiv", "crossref"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error("Auth error:", error);
    session = null;
  }

  const cloudBookmarksEnabled = Boolean(process.env.TURSO_DATABASE_URL);
  const githubEnabled = Boolean(
    cloudBookmarksEnabled &&
      process.env.AUTH_GITHUB_ID &&
      process.env.AUTH_GITHUB_SECRET
  );
  const demoLoginEnabled =
    process.env.AUTH_ENABLE_DEMO_LOGIN === "true" ||
    process.env.NODE_ENV !== "production";

  return (
    <html lang="id">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <Providers>
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                  JH
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-950">Journal Search Hub</p>
                  <p className="text-sm text-slate-500">Cari, baca, dan ekspor jurnal lebih cepat</p>
                </div>
              </div>

              <nav className="flex flex-wrap items-center gap-2">
                <Link
                  href="/"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cari
                </Link>
                <Link
                  href="/bookmarks"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Bookmark
                </Link>

                {session ? (
                  <div className="flex items-center gap-3 pl-2">
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-medium text-slate-900">{session.user?.name || "Pengguna"}</p>
                      <p className="text-xs text-slate-500">{session.user?.email || "Sesi aktif"}</p>
                    </div>
                    <form
                      action={async () => {
                        "use server";
                        await signOut();
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Logout
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pl-2">
                    {githubEnabled && (
                      <form
                        action={async () => {
                          "use server";
                          await signIn("github");
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                          Login GitHub
                        </button>
                      </form>
                    )}
                    {demoLoginEnabled && (
                      <form
                        action={async () => {
                          "use server";
                          await signIn("credentials", {
                            username: "demo",
                            password: "demo",
                            redirectTo: "/",
                          });
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                        >
                          Demo Login
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </nav>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

          <footer className="mt-16 border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-500 sm:px-6 lg:px-8">
              <p>Journal Search Hub membantu Anda mencari jurnal dari Crossref, PubMed, dan arXiv.</p>
              <p className="mt-2">
                PDF asli hanya tersedia bila sumber jurnal menyediakan file yang dapat diakses secara legal.
              </p>
              {!cloudBookmarksEnabled && (
                <p className="mt-2">
                  Deployment ini berjalan tanpa database cloud, jadi bookmark disimpan lokal di browser masing-masing.
                </p>
              )}
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
