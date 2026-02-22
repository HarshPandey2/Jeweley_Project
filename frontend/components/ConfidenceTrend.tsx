"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { fetchConfidenceTrend, type ConfidencePoint } from "@/lib/api";

export default function ConfidenceTrend() {
  const [points, setPoints] = useState<ConfidencePoint[]>([]);
  const loadTrend = useCallback(() => {
    fetchConfidenceTrend(10)
      .then((res) => setPoints(res.points || []))
      .catch(() => setPoints([]));
  }, []);

  useEffect(() => {
    loadTrend();
    const id = window.setInterval(loadTrend, 5000);
    return () => window.clearInterval(id);
  }, [loadTrend]);

  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-6">
        <div className="flex items-center gap-2 text-slate-400">
          <TrendingUp className="h-5 w-5" />
          <span className="font-medium">Confidence trend</span>
        </div>
        <p className="mt-4 text-sm text-slate-500">No data yet. Upload products to see trend.</p>
      </div>
    );
  }

  const maxConf = Math.max(...points.map((p) => p.confidence), 0.01);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-6">
      <div className="flex items-center gap-2 text-slate-300">
        <TrendingUp className="h-5 w-5 text-luxury-gold" />
        <span className="font-medium">Confidence trend</span>
      </div>
      <div className="mt-4 flex items-end gap-1 h-32">
        {points.slice(0, 10).reverse().map((p, i) => (
          <div
            key={p.id}
            className="flex-1 min-w-[24px] flex flex-col items-center gap-1"
            title={`${Math.round(p.confidence * 100)}% • ${p.source}`}
          >
            <div
              className="w-full rounded-t bg-luxury-gold/80 transition-all hover:bg-luxury-gold"
              style={{ height: `${(p.confidence / maxConf) * 100}%`, minHeight: 4 }}
            />
            <span className="text-[10px] text-slate-500 truncate w-full text-center">
              {p.date ? new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">Last 10 extractions</p>
    </div>
  );
}
