"use client";

import { useEffect, useState } from "react";
import JewelryTable from "@/components/JewelryTable";
import { fetchJewelryList, type JewelryRecord } from "@/lib/api";
import { Download } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const UPLOAD_BATCH_STORAGE_KEY = "jewelry_upload_batch_v1";

interface UploadBatchState {
  total: number;
  ids: string[];
  preProcessed: number;
  startedAt: string;
}

interface BatchProgress {
  processed: number;
  total: number;
}

export default function ProductsPage() {
  const [items, setItems] = useState<JewelryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [exportDate, setExportDate] = useState("");
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);

  const readBatchState = (): UploadBatchState | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(UPLOAD_BATCH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as UploadBatchState;
      if (!parsed || typeof parsed.total !== "number" || !Array.isArray(parsed.ids)) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const computeBatchProgress = (records: JewelryRecord[]): BatchProgress | null => {
    const batch = readBatchState();
    if (!batch || batch.total <= 0) return null;

    const byId = new Map(records.map((r) => [r.id, r]));
    const processedFromTrackedIds = batch.ids.reduce((count, id) => {
      const row = byId.get(id);
      if (!row) return count;
      return row.status === "Processing" ? count : count + 1;
    }, 0);

    const processed = Math.min(batch.total, processedFromTrackedIds + (batch.preProcessed || 0));
    return { processed, total: batch.total };
  };

  const load = (s?: string, st?: string, silent = false) => {
    if (!silent) setLoading(true);
    fetchJewelryList({ search: s ?? search, status: st ?? status })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        const batch = readBatchState();
        if (!batch) {
          setBatchProgress(null);
          return;
        }
        fetchJewelryList().then((all) => {
          setBatchProgress(computeBatchProgress(all.items));
        });
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      load(undefined, undefined, true);
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [search, status]);

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
          {batchProgress && (
            <p className="mt-1 text-xs text-slate-500">
              Batch progress:{" "}
              <span className="font-semibold text-luxury-gold">
                {batchProgress.processed}
              </span>{" "}
              processed of{" "}
              <span className="font-semibold text-slate-300">
                {batchProgress.total}
              </span>
            </p>
          )}
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
