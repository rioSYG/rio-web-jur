# Deploy Gratis: Vercel + Turso

Panduan ini menyiapkan web agar bisa diakses publik tanpa biaya, dengan hosting di Vercel dan database di Turso.

## Kenapa kombinasi ini

- Vercel Hobby gratis dan cocok untuk Next.js.
- Turso gratis, tanpa kartu kredit, dan kompatibel dengan SQLite/libSQL.
- Proyek ini tetap nyaman dikembangkan lokal memakai file SQLite.

Referensi resmi:

- Next.js Deploying: https://nextjs.org/docs/app/getting-started/deploying
- Vercel Hobby: https://vercel.com/docs/plans/hobby
- Prisma SQLite + Turso: https://docs.prisma.io/docs/orm/core-concepts/supported-databases/sqlite
- Prisma + Turso workflow: https://docs.prisma.io/docs/v6/orm/overview/databases/turso
- Turso import SQLite: https://docs.turso.tech/cloud/migrate-to-turso

## 1. Siapkan akun

Buat akun gratis:

- GitHub
- Vercel
- Turso

## 2. Import database lokal Anda ke Turso

Jika Anda ingin mempertahankan data lokal sekarang seperti user, session, dan bookmark, cara termudah adalah mengimpor `prisma/dev.db`.

Install Turso CLI, lalu login:

```bash
turso auth signup
```

Sebelum import, ubah database SQLite lokal ke WAL mode sesuai panduan Turso:

```bash
sqlite3 prisma/dev.db
PRAGMA journal_mode='wal';
PRAGMA wal_checkpoint(truncate);
.exit
```

Atau di Windows PowerShell, Anda bisa pakai helper yang sudah disediakan:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\prepare-turso-import.ps1
```

Import database:

```bash
turso db import prisma/dev.db
```

Database akan dibuat dari file lokal Anda dan membawa schema + data.

## 3. Ambil kredensial Turso

Ganti `nama-db` dengan nama database hasil import atau database yang Anda buat.

Ambil URL:

```bash
turso db show --url nama-db
```

Buat token:

```bash
turso db tokens create nama-db
```

Simpan nilai:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## 4. Push proyek ke GitHub

Kalau folder ini belum jadi git repo:

```bash
git init
git add .
git commit -m "Prepare free deploy with Turso and Vercel"
```

Lalu push ke repository GitHub baru.

## 5. Deploy ke Vercel

Di Vercel:

1. Klik `Add New Project`
2. Import repo GitHub Anda
3. Biarkan setting Next.js default
4. Tambahkan environment variables berikut

### Environment variables di Vercel

Wajib:

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
AUTH_SECRET=isi-random-panjang
```

Opsional:

```env
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
NEXT_PUBLIC_CROSSREF_EMAIL=your_email@example.com
```

Untuk membuat `AUTH_SECRET`, Anda bisa pakai:

```bash
npm run auth:secret
```

## 6. Jika ingin login GitHub di production

Buat GitHub OAuth App dan isi:

- Homepage URL: URL Vercel Anda
- Authorization callback URL: `https://domain-anda/api/auth/callback/github`

Lalu masukkan:

- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`

Jika belum diisi, aplikasi tetap bisa dipakai dengan `Demo Login`.

## 7. Future schema changes

Karena Turso memakai workflow lokal untuk Prisma CLI, lakukan perubahan schema seperti ini:

1. Ubah `prisma/schema.prisma`
2. Generate migrasi lokal:

```bash
npm run db:migrate:local -- --name nama_perubahan
```

3. Terapkan SQL ke Turso:

```bash
turso db shell nama-db < prisma/migrations/<folder_migrasi>/migration.sql
```

## 8. Alternatif bila ingin database kosong baru

Kalau tidak ingin import `prisma/dev.db`, Anda bisa:

1. Buat database Turso kosong
2. Gunakan file migrasi awal yang sudah ada di repo ini:

```bash
turso db shell nama-db < prisma/migrations/202604240001_init/migration.sql
```

## Checklist akhir

- Repo ada di GitHub
- Deploy Vercel sukses
- `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN` terpasang
- `AUTH_SECRET` terpasang
- Login demo jalan
- Search, detail, bookmark, export PDF, dan export DOCX berjalan
