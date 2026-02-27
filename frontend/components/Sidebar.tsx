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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-black/40 backdrop-blur-2xl">
      <div className="flex h-full flex-col">
        <Link
          href="/"
          className="flex items-center gap-3 border-b border-white/10 px-8 py-6 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-luxury-gold to-luxury-gold-dark shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-transform group-hover:scale-105">
            <Gem className="h-5 w-5 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold tracking-tight text-white leading-none">
              KaratPlus
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold mt-1">
              AI Platform
            </span>
          </div>
        </Link>
        <nav className="flex-1 space-y-2 p-5">
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
                  "flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-luxury-gold/15 text-luxury-gold shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_20px_rgba(212,175,55,0.1)] border border-luxury-gold/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                )}
              >
                <Icon className={clsx("h-5 w-5 shrink-0 transition-transform duration-300", isActive && "scale-110")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-6">
          <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
            Jewelry CAD Processing
          </p>
          <p className="mt-1 text-xs text-slate-600 font-semibold">Demo Platform v1.0</p>
        </div>
      </div>
    </aside>
  );
}
