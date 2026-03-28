"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

interface AppLayoutProps {
  children: React.ReactNode;
  user: { name: string; email: string };
  companyName: string;
  quoteBadgeCount?: number;
  agendaTodayCount?: number;
}

export function AppLayout({
  children,
  user,
  companyName,
  quoteBadgeCount,
  agendaTodayCount,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Sidebar
        user={user}
        companyName={companyName}
        quoteBadgeCount={quoteBadgeCount}
        agendaTodayCount={agendaTodayCount}
      />
      <MobileNav />

      <main className="mb-16 min-h-screen p-6 md:mb-0 md:ml-60">
        {children}
      </main>
    </div>
  );
}
