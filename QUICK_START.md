# 🚀 Journal Search Hub - Quick Start Guide

## ✅ Status: Aplikasi Siap Digunakan!

Aplikasi **Journal Search Hub** telah berhasil dibuat dan sedang berjalan di `http://localhost:3000`

---

## 📋 Fitur Utama yang Telah Diimplementasikan

### 1. **Pencarian Multi-Sumber** 🔍
   - Cari dari: PubMed, CrossRef, arXiv, Google Scholar
   - Dalam satu interface yang unified
   - Mock data untuk testing (siap untuk real API)

### 2. **Filter Lanjutan** 🎯
   - Filter berdasarkan tahun (maksimal 5 tahun ke belakang)
   - Filter berdasarkan kategori
   - Filter berdasarkan sumber
   - Sorting: Relevansi, Tanggal, Sitasi

### 3. **Hasil Pencarian yang Responsif** 📱
   - Tampilan sempurna di desktop, tablet, mobile
   - Pagination cerdas (smart page numbering)
   - Journal cards dengan info lengkap
   - Direct link ke full paper

### 4. **Bookmark Management** 📚
   - Simpan jurnal favorit dengan 1 klik
   - Tambahkan catatan pribadi pada setiap bookmark
   - Edit catatan kapan saja
   - Lihat semua bookmark di satu halaman

### 5. **Export Functionality** 💾
   - Export ke JSON (untuk data portability)
   - Export ke CSV (untuk spreadsheet)
   - Export ke BibTeX (untuk citation management)

### 6. **Detail Page** 📖
   - Informasi lengkap jurnal
   - Daftar penulis lengkap
   - Abstrak penuh
   - Kata kunci terkait
   - Identifikasi unik (DOI, PMID, arXiv ID)
   - Link ke full paper
   - Bookmark management

---

## 🎯 Cara Menggunakan Aplikasi

### **Halaman Utama (Home)**
1. Buka aplikasi di `http://localhost:3000`
2. Lihat hero section dengan penjelasan fitur
3. Ketik kata kunci pencarian di search bar
4. Tekan "Cari" atau Enter

### **Hasil Pencarian**
1. Lihat daftar jurnal yang cocok dengan query
2. Untuk setiap jurnal, Anda bisa:
   - **Klik judul/card** → Lihat detail lengkap
   - **Klik star** → Bookmark jurnal
   - **Klik "Lihat Jurnal"** → Buka full paper

### **Filter Hasil**
1. Klik "Filter & Pengaturan" 
2. Ubah:
   - Sumber (PubMed, CrossRef, arXiv, dll)
   - Kategori (Computer Science, Medicine, dll)
   - Tahun (dari - sampai)
   - Sorting (Relevansi, Terbaru, Sitasi)
   - Hasil per halaman
3. Perubahan filter langsung update hasil

### **Bookmark Jurnal**
1. Hover ke journal card
2. Klik icon star (bookmark)
3. Jurnal akan tersimpan di browser Anda

### **Lihat Detail Jurnal**
1. Klik pada judul atau card jurnal
2. Lihat:
   - Semua informasi jurnal
   - Daftar penulis lengkap
   - Abstrak dan keywords
   - Sitasi dan metadata
3. Tambahkan catatan pribadi (jika sudah di-bookmark)
4. Klik "Buka Jurnal Lengkap" untuk melihat full paper

### **Manage Bookmarks**
1. Klik menu "Bookmark" di header
2. Lihat semua jurnal yang disimpan
3. Untuk setiap bookmark:
   - Klik edit untuk menambah catatan
   - Klik star untuk menghapus bookmark
4. Export semua bookmark:
   - Pilih format (JSON/CSV/BibTeX)
   - Klik "Unduh Ekspor"

---

## 🔧 Perintah Terminal Berguna

```bash
# Jalankan development server (auto-reload)
npm run dev

# Build untuk production
npm run build

# Jalankan production server
npm start

# Check lint errors
npm run lint

# Clear build cache
npm run clean
```

---

## 📁 File Penting

| File | Deskripsi |
|------|-----------|
| `src/app/page.tsx` | Home page dengan search |
| `src/app/bookmarks/page.tsx` | Halaman bookmark |
| `src/app/detail/[id]/page.tsx` | Detail jurnal |
| `src/components/SearchBar.tsx` | Komponen search |
| `src/components/Filters.tsx` | Komponen filter |
| `src/components/JournalCard.tsx` | Komponen result card |
| `src/lib/api.ts` | Logika pencarian |
| `src/lib/storage.ts` | Local storage utils |
| `README.md` | Dokumentasi lengkap |

---

## 💾 Data Storage

Semua data disimpan di **browser local storage**:
- Bookmarks: `localStorage.journal_search_bookmarks`
- History: `localStorage.journal_search_history`

**Keuntungan:**
✅ Tidak ada data yang dikirim ke server
✅ Privacy terjaga
✅ Tidak perlu login

**Keterbatasan:**
⚠️ Data hanya tersimpan di device/browser itu
⚠️ Hapus cache browser = data hilang

---

## 🔌 API Integration (Untuk Production)

### PubMed
```bash
# 1. Daftar di: https://www.ncbi.nlm.nih.gov/account/
# 2. Dapatkan API key
# 3. Tambahkan ke .env.local:
NEXT_PUBLIC_PUBMED_API_KEY=your_key
```

### CrossRef
```bash
# Tidak perlu API key, tapi tambahkan email:
NEXT_PUBLIC_CROSSREF_EMAIL=your_email@example.com
```

### arXiv
```bash
# Sudah built-in, tidak perlu setup
# Ingat: Max 3 requests/detik
```

### Google Scholar (via SerpAPI)
```bash
# 1. Daftar di: https://serpapi.com
# 2. Dapatkan API key
# 3. Tambahkan ke .env.local:
NEXT_PUBLIC_SERPAPI_KEY=your_key
```

---

## 🎨 Design & UX

- **Responsive**: Mobile-first design
- **Colors**: Blue primary, with accent colors
- **Animations**: Smooth transitions & hover effects
- **Accessibility**: Semantic HTML, proper ARIA labels
- **Performance**: Optimized images, lazy loading

---

## 🔐 Privacy & Security

✅ **Pros:**
- No data sent to external servers (except journal sources)
- No tracking or analytics
- No cookies required
- Fully client-side

⚠️ **Notes:**
- Bookmarks tied to specific browser/device
- No backup/sync functionality
- Data lost if cache cleared

---

## 🚀 Deployment Options

### **Vercel (Recommended)**
```bash
# 1. Push ke GitHub
# 2. Connect repo di Vercel
# 3. Auto-deploy on push
```

### **Docker**
```bash
# 1. Build: docker build -t journal-search .
# 2. Run: docker run -p 3000:3000 journal-search
```

### **Self-hosted**
```bash
npm run build
npm start
```

---

## 🐛 Troubleshooting

### **Port 3000 sudah digunakan**
```bash
# Gunakan port berbeda:
npm run dev -- -p 3001
```

### **Module tidak ditemukan**
```bash
# Clear node_modules dan reinstall:
rm -r node_modules package-lock.json
npm install
```

### **Build error**
```bash
# Clear cache Next.js:
rm -r .next
npm run build
```

---

## 📚 Dokumentasi Lengkap

Lihat `README.md` untuk dokumentasi lebih detail:
- Setup API integration
- Export format specification
- Architecture details
- Future enhancements

---

## ✨ Highlights

✅ **Completed:**
- Multi-source search
- Advanced filtering
- Responsive design
- Bookmark management
- Export functionality
- Detail pages
- Personal notes
- Local storage

🚀 **Ready for:**
- Real API integration
- Backend database
- User authentication
- Deployment

---

## 📞 Support

Jika ada pertanyaan atau issue:
1. Lihat README.md
2. Check troubleshooting section
3. Review component documentation
4. Check console untuk error messages

---

## 🎉 Next Steps

1. ✅ Explore aplikasi di `http://localhost:3000`
2. ✅ Coba fitur search dan filter
3. ✅ Bookmark beberapa jurnal
4. ✅ Export bookmark dalam berbagai format
5. 🔄 (Optional) Set up real API keys untuk production
6. 🚀 (Optional) Deploy ke Vercel atau server sendiri

**Enjoy exploring the research world! 📚🔬**
