"use client";

import React, { useState } from "react";

const avatarSizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
} as const;

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: keyof typeof avatarSizes;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function Avatar({
  src,
  alt,
  name,
  size = "md",
  className = "",
  ...props
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = src && !imgError;
  const initials = name ? getInitials(name) : "?";

  return (
    <div
      className={[
        "relative shrink-0 inline-flex items-center justify-center rounded-full bg-zinc-200 font-medium text-zinc-600 overflow-hidden",
        avatarSizes[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-label={name || "Avatar"}>{initials}</span>
      )}
    </div>
  );
}

export { Avatar };
