"use client";

import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-card border border-zinc-200 shadow-lg animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
            <h2
              id="modal-title"
              className="text-base font-semibold text-zinc-900"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-200 bg-zinc-50/50 rounded-b-card">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export { Modal };
