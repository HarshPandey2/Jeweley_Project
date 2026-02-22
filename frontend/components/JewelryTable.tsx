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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by filename or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800/50 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-luxury-gold/50"
          />
        </form>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            onStatusFilter?.(e.target.value);
          }}
          className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm text-white focus:border-luxury-gold/50"
        >
          <option value="">All statuses</option>
          <option value="Completed">Completed</option>
          <option value="Review Required">Review Required</option>
          <option value="Processing">Processing</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
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
            <tbody className="divide-y divide-slate-700/30">
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
                    className="transition-colors hover:bg-slate-800/20"
                  >
                    <td className="px-6 py-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-slate-600 bg-slate-800">
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
                    <td className="px-6 py-3 text-sm text-slate-300">
                      {row.image_filename || "—"}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          row.status === "Completed"
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
                    <td className="px-6 py-3 text-sm text-slate-400">
                      {row.source === "AI" ? (
                        <span className="text-luxury-gold">AI</span>
                      ) : (
                        <span className="text-amber-400">OCR</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-700">
                          <div
                            className="h-full rounded-full bg-luxury-gold transition-all"
                            style={{
                              width: `${(row.confidence_score ?? 0) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {Math.round((row.confidence_score ?? 0) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/products/${row.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-luxury-gold hover:text-luxury-gold-light"
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
