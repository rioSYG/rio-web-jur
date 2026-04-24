# 📖 Journal Search Hub - Component Documentation

## Component Architecture

```
App Root (layout.tsx)
├── Header (Navigation)
├── Main Content
│   ├── Home Page (page.tsx)
│   │   ├── SearchBar
│   │   ├── Filters
│   │   ├── SearchResults
│   │   └── Pagination
│   │
│   ├── Bookmarks Page (/bookmarks)
│   │   ├── BookmarkList
│   │   ├── ExportButton
│   │   └── RefreshButton
│   │
│   └── Detail Page (/detail/[id])
│       ├── JournalHeader
│       ├── AuthorList
│       ├── AbstractSection
│       ├── KeywordsSection
│       ├── NotesSection
│       └── ActionButtons
│
└── Footer
```

---

## 🔧 Core Components

### **SearchBar.tsx**
Komponen untuk input pencarian utama

**Props:**
- `onSearch: (filters: SearchFilters) => void` - Callback saat user mencari
- `isLoading: boolean` - Loading state
- `defaultQuery?: string` - Default search query

**Features:**
- Input field dengan autocomplete support
- Submit button dengan loading indicator
- Mobile responsive
- Enter key support

**Usage:**
```tsx
<SearchBar 
  onSearch={handleSearch} 
  isLoading={isLoading}
  defaultQuery="machine learning"
/>
```

---

### **Filters.tsx**
Komponen filter lanjutan yang dapat di-collapse

**Props:**
- `filters: SearchFilters` - Current filter state
- `onFilterChange: (filters: SearchFilters) => void` - Update callback
- `isExpanded?: boolean` - Initial expand state

**Filter Options:**
- Source (All, PubMed, CrossRef, arXiv, Google Scholar)
- Category (All categories from mock data)
- Year From (last 10 years)
- Year To (last 10 years)
- Sort By (Relevance, Date, Citations)
- Page Size (5, 10, 20, 50)

**Features:**
- Collapsible panel
- All filters update state instantly
- Page resets to 1 when filters change
- Mobile responsive layout

**Usage:**
```tsx
<Filters 
  filters={filters}
  onFilterChange={handleFilterChange}
  isExpanded={false}
/>
```

---

### **JournalCard.tsx**
Komponen untuk menampilkan satu jurnal dalam list

**Props:**
- `journal: Journal` - Jurnal data
- `onBookmarkChange?: () => void` - Callback saat bookmark berubah

**Features:**
- Show title, authors, abstract
- Source badge dengan warna
- Category badge
- Year badge
- Citation count
- Bookmark toggle
- Link ke full paper
- Hover effects

**Usage:**
```tsx
<JournalCard 
  journal={journalData}
  onBookmarkChange={() => setRefresh()}
/>
```

---

### **Pagination.tsx**
Komponen pagination dengan smart page numbering

**Props:**
- `currentPage: number` - Halaman aktif
- `totalPages: number` - Total halaman
- `onPageChange: (page: number) => void` - Callback saat ganti halaman
- `isLoading: boolean` - Loading state

**Features:**
- Previous/Next buttons
- Smart page numbering (shows 1, ..., 4, 5, 6, ..., 100)
- Current page info
- Disabled saat loading
- Mobile responsive

**Usage:**
```tsx
<Pagination
  currentPage={filters.page}
  totalPages={totalPages}
  onPageChange={handlePageChange}
  isLoading={isLoading}
/>
```

---

## 📄 Page Components

### **Home Page (page.tsx)**
Main landing dan search page

**State Management:**
- `filters: SearchFilters` - Current search filters
- `results: Journal[]` - Search results
- `total: number` - Total results count
- `isLoading: boolean` - Loading state
- `hasSearched: boolean` - Has user searched?
- `refreshKey: number` - Force re-render

**Key Functions:**
- `handleSearch()` - Execute search
- `handleFilterChange()` - Update filters
- `handlePageChange()` - Change pagination

**Layout:**
```
Hero Section (if no search yet)
  ↓
Search Bar
  ↓
Filters (if searched)
  ↓
Results Section or Features Grid
  ↓
Pagination (if results exist)
```

---

### **Bookmarks Page (/bookmarks/page.tsx)**
Manage dan export saved bookmarks

**Features:**
- List all bookmarks
- Show bookmark count
- Export functionality
- Refresh button
- Empty state with CTA
- In-place editing of notes

**Export Formats:**
- **JSON**: Full bookmark objects
- **CSV**: Tabular format
- **BibTeX**: Citation format

**Usage Flow:**
1. User bookmarks journals from search
2. Goes to Bookmarks page
3. Sees all bookmarks
4. Can add/edit notes
5. Can export

---

### **Detail Page (/detail/[id]/page.tsx)**
Detailed view of single journal

**Layout Sections:**
1. **Header**
   - Title
   - Badges (Source, Category, Year)
   - Bookmark toggle

2. **Metadata**
   - Authors list
   - Publication date
   - Citation count
   - Journal name

3. **Content**
   - Abstract
   - Keywords
   - Identifiers (DOI, PMID, arXiv)

4. **Notes Section** (if bookmarked)
   - Edit/View notes
   - Save functionality

5. **Actions**
   - Open full paper
   - Toggle bookmark

---

## 🔌 Utility Functions

### **API Utilities (lib/api.ts)**

**`searchJournals(filters: SearchFilters)`**
- Main search function
- Simulates API calls with 500ms delay
- Filters mock data
- Handles pagination
- Returns: `{ journals, total }`

**`getJournalDetails(id: string)`**
- Get single journal detail
- Simulates 300ms delay
- Returns: `Journal | null`

**`getCategories()`**
- Get available categories
- Returns: `string[]`

**`getSources()`**
- Get available journal sources
- Returns: `Array<{ id, name }>`

### **Storage Utilities (lib/storage.ts)**

**Bookmark Functions:**
- `getBookmarkedJournals()` - Get all bookmarks
- `addBookmark(journal)` - Add to bookmarks
- `removeBookmark(id)` - Remove from bookmarks
- `isBookmarked(id)` - Check if bookmarked
- `updateBookmarkNotes(id, notes)` - Edit notes

**Export Functions:**
- `exportBookmarks(format)` - Export in format
  - Format: 'json' | 'csv' | 'bibtex'
  - Returns: formatted string

**All functions check `typeof window`** to ensure SSR compatibility

---

## 🎨 Styling System

### **Tailwind CSS Classes Used**

**Colors:**
- Primary: `blue-600`, `blue-700`
- Accents: `purple-600`, `green-600`, `yellow-500`
- Backgrounds: `white`, `gray-50`, `gray-100`
- Text: `gray-900`, `gray-700`, `gray-600`, `gray-500`

**Responsive Breakpoints:**
- `sm:` (640px)
- `md:` (768px)
- `lg:` (1024px)

**Common Patterns:**
- Cards: `bg-white rounded-lg shadow-md`
- Buttons: `px-4 py-2 rounded-lg transition-colors`
- Badges: `inline-block px-3 py-1 rounded-full text-sm`
- Inputs: `px-3 py-2 border border-gray-300 rounded-lg`

---

## 🔄 State Flow

### **Search Flow**
```
User Types Query
    ↓
Submit Form
    ↓
handleSearch()
    ↓
setIsLoading(true)
    ↓
searchJournals(filters)
    ↓
setResults() + setTotal()
    ↓
setIsLoading(false)
    ↓
Render Results
```

### **Bookmark Flow**
```
User Clicks Star
    ↓
Check if Bookmarked
    ↓
If No: addBookmark()
If Yes: removeBookmark()
    ↓
toggleBookmark State
    ↓
Refresh UI
    ↓
Go to Bookmarks → See in List
```

### **Filter Flow**
```
User Changes Filter
    ↓
onFilterChange()
    ↓
Set page = 1
    ↓
searchJournals(newFilters)
    ↓
Results Update
    ↓
Pagination Reset
```

---

## 🧪 Testing Tips

### **Manual Testing Checklist**

#### Search
- [ ] Search works with different queries
- [ ] Empty search shows hero
- [ ] Search results show correct data
- [ ] Loading indicator works

#### Filtering
- [ ] Filter collapsible works
- [ ] Each filter option works independently
- [ ] Filters can be combined
- [ ] Page resets when filter changes

#### Pagination
- [ ] Page navigation works
- [ ] Can go to first/last page
- [ ] Disabled correctly at boundaries
- [ ] Results update with page change

#### Bookmarks
- [ ] Can bookmark a journal
- [ ] Star fills when bookmarked
- [ ] Can unbookmark
- [ ] Bookmarks persist after refresh

#### Detail Page
- [ ] All journal info displays
- [ ] Bookmark toggle works
- [ ] Notes can be added/edited
- [ ] External links work

#### Export
- [ ] JSON export has correct format
- [ ] CSV export is valid
- [ ] BibTeX export is valid
- [ ] File downloads correctly

---

## 🚀 Performance Tips

### **Optimizations Made**
- Use `useCallback` for function stability
- `Key` in lists for React reconciliation
- Lazy load images (if added)
- Memoize expensive components (future)
- Pagination prevents huge lists

### **Further Optimizations**
- Implement request debouncing
- Add response caching
- Use React Query for data fetching
- Implement virtualization for large lists
- Optimize bundle size

---

## 🔗 Type Definitions

```typescript
interface SearchFilters {
  query: string;
  yearFrom: number;
  yearTo: number;
  source: 'all' | 'pubmed' | 'crossref' | 'arxiv' | 'google';
  category?: string;
  sortBy: 'relevance' | 'date' | 'citations';
  pageSize: number;
  page: number;
}

interface Journal {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedDate: string;
  source: string;
  citations?: number;
  doi?: string;
  pmid?: string;
  arxivId?: string;
  url: string;
  keywords?: string[];
  journal?: string;
  category?: string;
}

interface BookmarkedJournal extends Journal {
  bookmarkedAt: string;
  notes?: string;
}
```

---

## 📚 Further Reading

- [Next.js Documentation](https://nextjs.org/docs)
- [React Hooks Guide](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
