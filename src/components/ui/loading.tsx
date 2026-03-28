import React from "react";

const spinnerSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

export interface SpinnerProps {
  size?: keyof typeof spinnerSizes;
  className?: string;
}

function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <svg
      className={["animate-spin text-zinc-400", spinnerSizes[size], className]
        .filter(Boolean)
        .join(" ")}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

function Skeleton({
  className = "",
  width,
  height = "1rem",
  rounded = false,
}: SkeletonProps) {
  return (
    <div
      className={[
        "animate-pulse bg-zinc-200",
        rounded ? "rounded-full" : "rounded-input",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export { Spinner, Skeleton };
