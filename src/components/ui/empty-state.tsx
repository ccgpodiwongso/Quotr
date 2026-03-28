import React from "react";
import type { LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "./button";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonProps["variant"];
  className?: string;
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = "primary",
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 mb-4">
        <Icon className="h-6 w-6 text-zinc-400" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-zinc-500 max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant={actionVariant} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export { EmptyState };
