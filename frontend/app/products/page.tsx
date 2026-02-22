"use client";

import { useEffect, useState } from "react";
import JewelryTable from "@/components/JewelryTable";
import { fetchJewelryList, type JewelryRecord } from "@/lib/api";

export default function ProductsPage() {
  const [items, setItems] = useState<JewelryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

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
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-white">
          Products
        </h1>
        <p className="mt-1 text-slate-400">
          Search and manage extracted jewelry specifications
        </p>
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
