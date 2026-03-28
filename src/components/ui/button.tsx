"use client";

import React from "react";
import { Loader2 } from "lucide-react";

const variantStyles = {
  primary:
    "bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary/50",
  secondary:
    "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 focus-visible:ring-zinc-300",
  ghost:
    "bg-transparent text-zinc-700 hover:bg-zinc-100 focus-visible:ring-zinc-300",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400",
} as const;

const sizeStyles = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-base gap-2.5",
} as const;

const iconOnlySizeStyles = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-11 w-11",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  loading?: boolean;
  iconOnly?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      loading = false,
      iconOnly = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={[
          "inline-flex items-center justify-center font-medium rounded-md transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantStyles[variant],
          iconOnly ? iconOnlySizeStyles[size] : sizeStyles[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
