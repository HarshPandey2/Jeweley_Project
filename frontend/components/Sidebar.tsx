"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Package,
  Gem,
} from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/products", label: "Products", icon: Package },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-700/50 bg-luxury-dark/95 backdrop-blur">
      <div className="flex h-full flex-col">
        <Link
          href="/"
          className="flex items-center gap-2 border-b border-slate-700/50 px-6 py-5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold shadow-gold">
            <Gem className="h-5 w-5 text-luxury-dark" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight text-white">
            KaratPlus
          </span>
          <span className="rounded bg-luxury-gold/20 px-1.5 py-0.5 text-xs font-medium text-luxury-gold">
            AI
          </span>
        </Link>
        <nav className="flex-1 space-y-0.5 p-4">
          {nav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-luxury-gold/15 text-luxury-gold"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-700/50 p-4">
          <p className="text-xs text-slate-500">
            Jewelry CAD Processing
          </p>
          <p className="mt-0.5 text-xs text-slate-600">Demo Platform</p>
        </div>
      </div>
    </aside>
  );
}
