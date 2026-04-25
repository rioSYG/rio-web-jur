import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { cookies } from "next/headers";

import { Providers } from "@/components/Providers";
import { TranslationProvider } from "@/components/TranslationProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getDictionary, type Locale } from "@/lib/i18n";
import { auth, signIn, signOut } from "@/lib/auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RIO Academic Library",
  description:
    "Perpustakaan digital RIO untuk pencarian jurnal dari Crossref, PubMed, arXiv, GARUDA, dan DOAJ Indonesia.",
  keywords: ["rio library", "journal search", "pencarian jurnal", "pubmed", "arxiv", "crossref", "garuda"],
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

  const cookieStore = await cookies();
  const localeStr = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;
  const locale = localeStr === "en" ? "en" : "id";
  const dict = getDictionary(locale);

  return (
    <html lang={locale}>
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <TranslationProvider dict={dict} locale={locale}>
          <Providers>
          <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-base font-bold text-white shadow-md">
                  R
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight text-slate-900 font-serif">RIO Academic Library</p>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{dict.nav.appTagline}</p>
                </div>
              </div>

              <nav className="flex flex-wrap items-center gap-2">
                <Link
                  href="/"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {dict.nav.search}
                </Link>
                <Link
                  href="/bookmarks"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {dict.nav.bookmark}
                </Link>

                <LanguageSwitcher />

                {session ? (
                  <div className="flex items-center gap-3 pl-2">
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-medium text-slate-900">{session.user?.name || dict.nav.guestUser}</p>
                      <p className="text-xs text-slate-500">{session.user?.email || dict.nav.activeSession}</p>
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
                        {dict.nav.logout}
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
                          {dict.nav.loginGithub}
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
                          {dict.nav.demoLogin}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </nav>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

          <footer className="mt-16 border-t border-slate-200/60 bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-slate-500 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-300 text-xs font-bold text-slate-700">
                  R
                </div>
                <p className="font-bold text-slate-700 font-serif">RIO Academic Library</p>
              </div>
              <p>{dict.footer.desc}</p>
              <p className="mt-2 text-xs">
                {dict.footer.copyright}
              </p>
              {!cloudBookmarksEnabled && (
                <p className="mt-2 rounded-lg bg-yellow-50 px-3 py-2 text-yellow-800 inline-block text-xs">
                  {dict.footer.localBookmark}
                </p>
              )}
            </div>
          </footer>
        </Providers>
        </TranslationProvider>
      </body>
    </html>
  );
}
