# Project Source Code: sap-material-app


```

### next.config.ts
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

---


### app/page.tsx
```typescript
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SapMatlStkInAcctMod, MaterialWithUI } from '@/types/material';

const ITEMS_PER_PAGE = 12;

type MaterialFilter = 'all' | 'favorites' | 'memos';
type MaterialSortField = 'material' | 'plant';

export default function MaterialsPage() {
  const [allMaterials, setAllMaterials] = useState<MaterialWithUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState('');
  const [savedMemos, setSavedMemos] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<MaterialFilter>('all');

  // -------- Data Fetching --------
  useEffect(() => {
    async function loadMaterials() {
      try {
        const response = await fetch('/api/materials');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch');
        }

        const enriched: MaterialWithUI[] = data.map(
          (m: SapMatlStkInAcctMod, index: number) => {
            const quantity = Number.parseFloat(m.MatlWrhsStkQtyInMatlBaseUnit) || 0;
            return {
              id: `${m.Material}-${m.Plant}-${m.StorageLocation}-${index}`,
              material: m.Material,
              plant: m.Plant,
              storageLocation: m.StorageLocation?.trim() || '-',
              quantity,
              unit: m.MaterialBaseUnit,
              status: quantity < 10 ? 'Low' : 'OK',
              favourite: false,
              memoCount: 0,
            };
          }
        );
        setAllMaterials(enriched);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Cannot get SAP data.');
      } finally {
        setLoading(false);
      }
    }
    void loadMaterials();
  }, []);

  // -------- Filtering (useMemo — search box ရိုက်တိုင်း auto-filter) --------
  const filteredMaterials = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    return allMaterials.filter(
      (m) =>
        (!term ||
          m.material.toLowerCase().includes(term) ||
          m.plant.toLowerCase().includes(term)) &&
        (activeFilter !== 'favorites' || m.favourite) &&
        (activeFilter !== 'memos' || m.memoCount > 0)
    );
  }, [allMaterials, searchInput, activeFilter]);

  // -------- Pagination --------
  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE));
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // -------- Summary Counts --------
  const counts = useMemo(
    () => ({
      favourites: allMaterials.filter((m) => m.favourite).length,
      memos: allMaterials.filter((m) => m.memoCount > 0).length,
      high: allMaterials.filter((m) => m.status === 'OK').length,
      low: allMaterials.filter((m) => m.status === 'Low').length,
    }),
    [allMaterials]
  );

  // -------- Action Handlers --------
  function handleSearchInputChange(value: string) {
    setSearchInput(value);
    setCurrentPage(1);
  }

  function handleReset() {
    setSearchInput('');
    setActiveFilter('all');
    setCurrentPage(1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') setCurrentPage(1);
  }

  function toggleFilter(filter: Exclude<MaterialFilter, 'all'>) {
    setActiveFilter((current) => (current === filter ? 'all' : filter));
    setCurrentPage(1);
  }

  function toggleFavourite(id: string) {
    setAllMaterials((materials) =>
      materials.map((m) => (m.id === id ? { ...m, favourite: !m.favourite } : m))
    );
  }

  function sortMaterials(field: MaterialSortField) {
    setAllMaterials((materials) =>
      [...materials].sort((a, b) =>
        a[field].localeCompare(b[field], undefined, { numeric: true, sensitivity: 'base' })
      )
    );
  }

  function openMemo(material: MaterialWithUI) {
    setEditingMemoId(material.id);
    setMemoDraft(savedMemos[material.id] || '');
  }

  function closeMemo() {
    setEditingMemoId(null);
    setMemoDraft('');
  }

  function submitMemo() {
    if (!editingMemoId) return;

    setSavedMemos((prev) => ({ ...prev, [editingMemoId]: memoDraft }));
    setAllMaterials((materials) =>
      materials.map((m) =>
        m.id === editingMemoId ? { ...m, memoCount: memoDraft.trim() ? 1 : 0 } : m
      )
    );
    closeMemo();
  }

  // -------- Loading / Error States --------
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-indigo-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="font-medium text-slate-500">Getting SAP data...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-indigo-50">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 shadow-lg">
          <p className="mb-1 font-semibold text-red-600">Error Occurs</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </main>
    );
  }

  const firstItem = filteredMaterials.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const lastItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredMaterials.length);

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-linear-to-br from-slate-50 to-indigo-50 p-4">
      {/* Header */}
      <header className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold bg-linear-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          SAP Material Stock
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Real-time inventory is fetched from SAP S/4HANA Cloud.
        </p>
      </header>

      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-100 bg-white shadow-xl shadow-indigo-100/50">
        {/* Search Bar */}
        <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 p-4">
          <div className="flex gap-3">
            <input
              type="search"
              placeholder="Search by material code or plant..."
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={() => setCurrentPage(1)}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"
            >
              Search
            </button>
            {(searchInput || activeFilter !== 'all') && (
              <button
                onClick={handleReset}
                className="shrink-0 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Summary Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/30 px-4 py-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Showing <span className="font-semibold text-slate-600">{firstItem}-{lastItem}</span> of{' '}
              <span className="font-semibold text-slate-600">{filteredMaterials.length}</span>
            </span>
            <button
              onClick={() => toggleFilter('favorites')}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm transition-all ${
                activeFilter === 'favorites'
                  ? 'border-amber-600 bg-amber-500 text-white ring-2 ring-amber-300'
                  : 'border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Favorites: {counts.favourites}
            </button>
            <button
              onClick={() => toggleFilter('memos')}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm transition-all ${
                activeFilter === 'memos'
                  ? 'border-indigo-700 bg-indigo-600 text-white ring-2 ring-indigo-300'
                  : 'border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              Memos: {counts.memos}
            </button>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-600">
              High: {counts.high}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 font-semibold text-red-600">
              Low: {counts.low}
            </span>
          </div>
          <span className="flex items-center gap-1.5 font-medium text-amber-600">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Quantity lower than 10 is highlighted
          </span>
        </div>

        {/* Table */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <table className="w-full table-fixed text-xs">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="bg-linear-to-br from-indigo-50 to-violet-50 text-slate-600">
                <th className="w-[14%] px-3 py-2 text-left text-sm font-semibold">
                  <button
                    onClick={() => sortMaterials('material')}
                    className="hover:text-indigo-600"
                    aria-label="Sort material in ascending order"
                  >
                    Material
                  </button>
                </th>
                <th className="w-[10%] px-3 py-2 text-left text-sm font-semibold">
                  <button
                    onClick={() => sortMaterials('plant')}
                    className="hover:text-indigo-600"
                    aria-label="Sort plant in ascending order"
                  >
                    Plant
                  </button>
                </th>
                <th className="w-[15%] px-3 py-2 text-left text-sm font-semibold">Storage Location</th>
                <th className="w-[13%] px-3 py-2 text-right text-sm font-semibold">Quantity</th>
                <th className="w-[9%] px-3 py-2 text-left text-sm font-semibold">Unit</th>
                <th className="w-[13%] px-3 py-2 text-left text-sm font-semibold">Status</th>
                <th className="w-[11%] px-3 py-2 text-center text-sm font-semibold">Favourite</th>
                <th className="w-[15%] px-3 py-2 text-center text-sm font-semibold">Memo / Note</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    {activeFilter === 'all'
                      ? 'No search results'
                      : `No registered ${activeFilter} found matching criteria.`}
                  </td>
                </tr>
              ) : (
                paginatedMaterials.map((m) => (
                  <tr
                    key={m.id}
                    className={`border-t border-slate-50 transition-colors hover:bg-slate-50/70 ${
                      m.quantity < 10 ? 'bg-amber-100/60' : ''
                    }`}
                  >
                    <td className="truncate px-3 py-2 text-sm font-medium text-slate-700">{m.material}</td>
                    <td className="truncate px-3 py-2 text-sm text-slate-500">{m.plant}</td>
                    <td className="truncate px-3 py-2 text-sm text-slate-500">{m.storageLocation}</td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-slate-700">
                      {m.quantity.toLocaleString()}
                    </td>
                    <td className="truncate px-3 py-2 text-sm text-slate-500">{m.unit}</td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.status === 'Low' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => toggleFavourite(m.id)}
                        aria-label={`Toggle favourite for ${m.material}`}
                        className="inline-flex items-center justify-center transition-transform hover:scale-125"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill={m.favourite ? '#f59e0b' : 'none'}
                          stroke={m.favourite ? '#f59e0b' : '#334155'}
                          strokeWidth="1.8"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                          />
                        </svg>
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => openMemo(m)}
                        className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-all ${
                          savedMemos[m.id]
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {savedMemos[m.id] ? 'Memo (1)' : 'Memo'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <nav
          aria-label="Pagination"
          className="flex shrink-0 items-center justify-center gap-4 border-t border-slate-100 px-4 py-3"
        >
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="rounded-lg px-4 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400">
            Page <span className="font-semibold text-indigo-600">{currentPage}</span> of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="rounded-lg px-4 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            Next
          </button>
        </nav>
      </section>

      {/* Memo Modal */}
      {editingMemoId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="memo-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <h2 id="memo-title" className="text-base font-bold text-slate-800">
                Material Note / Memo
              </h2>
              <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[10px] text-indigo-600">
                ID: {editingMemoId.split('-')[0]}
              </span>
            </div>
            <p className="mb-4 text-xs text-slate-400">You can write a note for this product.</p>
            <textarea
              value={memoDraft}
              onChange={(e) => setMemoDraft(e.target.value)}
              placeholder="Enter your note..."
              className="h-32 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeMemo}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={submitMemo}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
```

### app/globals.css
```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

### app/api/materials/route.ts
```typescript
import { NextResponse } from 'next/server';
import { SapMatlStkInAcctMod } from '@/types/material';

export async function GET() {
  const baseUrl = process.env.SAP_MATERIAL_API_URL;
  const user = process.env.SAP_COMM_USER;
  const password = process.env.SAP_COMM_PASSWORD;

  if (!baseUrl || !user || !password) {
    return NextResponse.json(
      { error: 'Not complete SAP credentials' },
      { status: 500 }
    );
  }

  try {
    const url = `${baseUrl}/A_MatlStkInAcctMod?$format=json&$filter=Material ne ''&$top=1500`;

    const response = await fetch(url, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64'),
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SAP API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `SAP API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    let rawResults: SapMatlStkInAcctMod[] = [];

    if (Array.isArray(data?.d?.results)) {
      rawResults = data.d.results;
    } else if (Array.isArray(data?.d)) {
      rawResults = data.d;
    } else if (
      data?.d &&
      typeof data.d === 'object' &&
      Object.keys(data.d).length > 0
    ) {
      rawResults = [data.d];
    }

    return NextResponse.json(rawResults);
  } catch (error) {
    console.error('SAP fetch failed:', error);
    return NextResponse.json(
      { error: 'Can not connect to SAP system' },
      { status: 500 }
    );
  }
}
```

### types/material.ts
```typescript
export interface SapMatlStkInAcctMod {
    Material: string;
    Plant: string;
    StorageLocation: string;
    MaterialBaseUnit: string;
    MatlWrhsStkQtyInMatlBaseUnit: string;
  }
  
export interface MaterialWithUI {
    id: string; 
    material: string;
    plant: string;
    storageLocation: string;
    quantity: number;
    unit: string;
    status: 'Low' | 'OK';
    favourite: boolean;
    memoCount: number;
  }