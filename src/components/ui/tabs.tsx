"use client";

import React, { useState, createContext, useContext } from "react";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tab components must be used within <Tabs>");
  return ctx;
}

export interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
  className?: string;
  onChange?: (tab: string) => void;
}

function Tabs({ defaultTab, children, className = "", onChange }: TabsProps) {
  const [activeTab, setActiveTabState] = useState(defaultTab);

  const setActiveTab = (id: string) => {
    setActiveTabState(id);
    onChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

function TabList({ children, className = "" }: TabListProps) {
  return (
    <div
      role="tablist"
      className={[
        "flex border-b border-zinc-200 gap-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export interface TabTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function TabTrigger({ value, children, className = "" }: TabTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={[
        "px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2",
        isActive
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

export interface TabPanelProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function TabPanel({ value, children, className = "" }: TabPanelProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;

  return (
    <div role="tabpanel" className={["pt-4", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

export { Tabs, TabList, TabTrigger, TabPanel };
