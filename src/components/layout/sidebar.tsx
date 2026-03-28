"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  Briefcase,
  Calendar,
  Settings,
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface SidebarProps {
  user: { name: string; email: string };
  companyName: string;
  quoteBadgeCount?: number;
  agendaTodayCount?: number;
}

export function Sidebar({
  user,
  companyName,
  quoteBadgeCount,
  agendaTodayCount,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/app", icon: LayoutDashboard },
    {
      label: "Quotes",
      href: "/app/quotes",
      icon: FileText,
      badge: quoteBadgeCount,
    },
    { label: "Invoices", href: "/app/invoices", icon: Receipt },
    { label: "Clients", href: "/app/clients", icon: Users },
    { label: "Services", href: "/app/services", icon: Briefcase },
    {
      label: "Agenda",
      href: "/app/agenda",
      icon: Calendar,
      badge: agendaTodayCount,
    },
    { label: "Settings", href: "/app/settings", icon: Settings },
  ];

  function isActive(href: string): boolean {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col border-r border-zinc-200 bg-white md:flex">
      {/* Company logo / name */}
      <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
          {companyName.charAt(0).toUpperCase()}
        </div>
        <span className="truncate text-sm font-semibold text-primary">
          {companyName}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-zinc-100 text-blue-600"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                  ].join(" ")}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={[
                        "ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-200 text-zinc-700",
                      ].join(" ")}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-zinc-200 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">
              {user.name}
            </p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
