"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Calendar,
  Menu,
} from "lucide-react";

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: MobileNavItem[] = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "Quotes", href: "/app/quotes", icon: FileText },
  { label: "Invoices", href: "/app/invoices", icon: Receipt },
  { label: "Agenda", href: "/app/agenda", icon: Calendar },
  { label: "More", href: "/app/settings", icon: Menu },
];

export function MobileNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="flex items-center justify-around px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
