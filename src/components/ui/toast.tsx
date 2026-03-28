"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const iconMap: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const variantStyles: Record<ToastVariant, string> = {
  success: "border-green-200 bg-white text-green-700",
  error: "border-red-200 bg-white text-red-700",
  info: "border-blue-200 bg-white text-blue-700",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, variant }]);

      const timer = setTimeout(() => removeToast(id), 5000);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
      >
        {toasts.map((t) => {
          const Icon = iconMap[t.variant];
          return (
            <div
              key={t.id}
              className={[
                "flex items-start gap-3 rounded-card border px-4 py-3 shadow-lg animate-in slide-in-from-right",
                variantStyles[t.variant],
              ].join(" ")}
            >
              <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm flex-1">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-0.5 rounded hover:bg-zinc-100 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
