"use client";

import { useEffect, useState } from "react";
import JewelryTable from "@/components/JewelryTable";
import { fetchJewelryList, type JewelryRecord } from "@/lib/api";
import { Download } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ProductsPage() {
  const [items, setItems] = useState<JewelryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [exportDate, setExportDate] = useState("");

  const load = (s?: string, st?: string) => {
    setLoading(true);
    fetchJewelryList({ search: s ?? search, status: st ?? status })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (s: string) => {
    setSearch(s);
    load(s, status);
  };

  const handleStatusFilter = (st: string) => {
    setStatus(st);
    load(search, st);
  };

  return (
    <div className="p-8">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white">
            Products
          </h1>
          <p className="mt-1 text-slate-400">
            Search and manage extracted jewelry specifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={exportDate}
            onChange={(e) => setExportDate(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white outline-none focus:border-luxury-gold"
            title="Filter export by date"
          />
          <button
            onClick={() => {
              const url = exportDate ? `${API_BASE}/api/jewelry/export?date=${exportDate}` : `${API_BASE}/api/jewelry/export`;
              window.open(url, "_blank");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-luxury-gold px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-[#D4AF37]/90 hover:shadow-gold active:scale-95"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </header>
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-luxury-gold border-t-transparent" />
        </div>
      ) : (
        <JewelryTable
          items={items}
          total={total}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
        />
      )}
    </div>
  );
}
