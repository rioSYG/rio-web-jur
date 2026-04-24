# Journal Search Hub

Aplikasi pencarian jurnal berbasis Next.js dengan detail artikel, bookmark, catatan, dan ekspor PDF/DOCX.

## Stack

- Next.js 16 App Router
- Prisma 7
- Auth.js / NextAuth
- SQLite lokal untuk development
- Turso (libSQL) untuk hosting gratis produksi

## Jalankan lokal

```bash
npm install
npm run dev
```

Isi `.env` lokal minimal:

```env
LOCAL_DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="ganti-dengan-secret-acak"
```

## Script penting

```bash
npm run lint
npm run build
npm run db:generate
npm run db:push
npm run db:migrate:local
npm run db:migrate:diff
```

## Database strategy

Repo ini sekarang memakai dua mode:

- Development / Prisma CLI: `LOCAL_DATABASE_URL`
- Production runtime: `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`

Ini mengikuti workflow resmi Prisma untuk Turso: migrasi dibuat terhadap SQLite lokal, lalu SQL hasilnya diterapkan ke Turso.

## Deploy gratis

Lihat panduan lengkap di [DEPLOY_FREE.md](./DEPLOY_FREE.md).
