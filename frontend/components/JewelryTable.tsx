"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ChevronRight, Sparkles, FileSearch } from "lucide-react";
import type { JewelryRecord } from "@/lib/api";

interface JewelryTableProps {
  items: JewelryRecord[];
  total: number;
  onSearch?: (search: string) => void;
  onStatusFilter?: (status: string) => void;
}

export default function JewelryTable({
  items,
  total,
  onSearch,
  onStatusFilter,
}: JewelryTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(search);
  };
  const getConfidenceBadgeStyle = (score: number) => {
    const percentage = score * 100;
    if (percentage >= 90) return "bg-green-100 text-green-700";
    if (percentage >= 80) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 font-bold" />
          <input
            type="text"
            placeholder="Search by filename or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-luxury-gold/50 transition-colors shadow-inner"
          />
        </form>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            onStatusFilter?.(e.target.value);
          }}
          className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md px-5 py-2.5 text-sm text-slate-200 focus:border-luxury-gold/50 cursor-pointer transition-colors shadow-inner"
        >
          <option value="" className="bg-luxury-dark">All statuses</option>
          <option value="Completed" className="bg-luxury-dark">Completed</option>
          <option value="Review Required" className="bg-luxury-dark">Review Required</option>
          <option value="Processing" className="bg-luxury-dark">Processing</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-white/10 bg-black/40">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Preview
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  File
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Source
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Confidence
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No products yet. Upload a specification sheet to get started.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-white/5"
                  >
                    <td className="px-6 py-4">
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-black/20 shadow-md">
                        {row.image_url ? (
                          <Image
                            src={row.image_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-500">
                            —
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-200">
                      {row.image_filename || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${row.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : row.status === "Review Required"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-slate-500/20 text-slate-400"
                          }`}
                      >
                        {row.status === "Completed" && (
                          <Sparkles className="h-3 w-3" />
                        )}
                        {row.status === "Review Required" && (
                          <FileSearch className="h-3 w-3" />
                        )}
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold tracking-wide">
                      {row.source === "AI" ? (
                        <span className="text-luxury-gold drop-shadow-md">AI</span>
                      ) : (
                        <span className="text-amber-400 drop-shadow-md">OCR</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getConfidenceBadgeStyle(
                            row.confidence_score ?? 0
                          )}`}
                        >
                          {Math.round((row.confidence_score ?? 0) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/products/${row.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-luxury-gold-light hover:bg-luxury-gold/10 hover:shadow-lg transition-all"
                      >
                        View
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm text-slate-500">
        Showing {items.length} of {total} product{total !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
