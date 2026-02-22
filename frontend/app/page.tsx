"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { fetchStats, type Stats } from "@/lib/api";
import ConfidenceTrend from "@/components/ConfidenceTrend";

const EMPTY_STATS: Stats = { total: 0, pending: 0, completed: 0, review_required: 0, processing: 0 };

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);

  const loadStats = useCallback(async () => {
    const latest = await fetchStats();
    setStats(latest);
  }, []);

  useEffect(() => {
    loadStats();
    const id = window.setInterval(loadStats, 5000);
    return () => window.clearInterval(id);
  }, [loadStats]);

  const cards = [
    {
      label: "Total products",
      value: stats.total,
      icon: Package,
      color: "text-slate-300",
      bg: "bg-slate-800/50",
      border: "border-slate-700/50",
    },
    {
      label: "Pending / Processing",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    {
      label: "Review required",
      value: stats.review_required,
      icon: AlertCircle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
  ];

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-slate-400">
          Overview of your jewelry specification extractions
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-xl border ${card.border} ${card.bg} p-6 transition-shadow hover:shadow-gold`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">
                  {card.label}
                </span>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="mt-2 font-display text-2xl font-semibold text-white">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <ConfidenceTrend />
      </div>
    </div>
  );
}
