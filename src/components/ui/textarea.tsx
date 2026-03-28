"use client";

import React, { useState, useCallback } from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className = "",
      label,
      error,
      maxLength,
      showCount = false,
      id,
      onChange,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(
      () => String(value ?? defaultValue ?? "").length
    );
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCharCount(e.target.value.length);
        onChange?.(e);
      },
      [onChange]
    );

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-zinc-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            "w-full min-h-[80px] rounded-input border bg-white px-3 py-2 text-sm text-zinc-900",
            "placeholder:text-zinc-400 resize-y",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-zinc-300",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          {...props}
        />
        <div className="flex items-center justify-between">
          {error && <p className="text-xs text-red-600">{error}</p>}
          {showCount && (
            <p className="text-xs text-zinc-400 ml-auto font-mono">
              {charCount}
              {maxLength != null && `/${maxLength}`}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
