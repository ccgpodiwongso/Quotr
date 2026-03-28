"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

function Dropdown({ trigger, items, align = "left" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, handleClickOutside]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <div
        onClick={() => setOpen((prev) => !prev)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {open && (
        <div
          className={[
            "absolute z-50 mt-1 min-w-[180px] rounded-card border border-zinc-200 bg-white shadow-lg py-1",
            align === "right" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  setOpen(false);
                }
              }}
              disabled={item.disabled}
              className={[
                "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                item.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-zinc-50",
                item.danger ? "text-red-600" : "text-zinc-700",
              ].join(" ")}
            >
              {item.icon && (
                <span className="shrink-0 h-4 w-4">{item.icon}</span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { Dropdown };
