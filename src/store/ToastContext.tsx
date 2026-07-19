"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Toast } from "@/types";
import { generateId, cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

// =============================================================================
// TOAST SYSTEM
// Global, imperative-feeling API (`toast.success("Saved")`) backed by React
// Context + state. Every CRUD action across every module reports through
// this single surface so feedback is consistent app-wide.
// =============================================================================

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = generateId("toast");
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
}

/** Convenience hook: `const toast = useToast(); toast.success("Saved!")` */
export function useToast() {
  const { showToast } = useToastContext();
  return useMemo(
    () => ({
      success: (title: string, description?: string) => showToast({ title, description, variant: "success" }),
      error: (title: string, description?: string) => showToast({ title, description, variant: "error" }),
      info: (title: string, description?: string) => showToast({ title, description, variant: "info" }),
      warning: (title: string, description?: string) => showToast({ title, description, variant: "warning" }),
    }),
    [showToast]
  );
}

const VARIANT_STYLES: Record<Toast["variant"], { icon: "checkCircle" | "alertCircle" | "info" | "alertTriangle"; iconColor: string; ring: string }> = {
  success: { icon: "checkCircle", iconColor: "text-emerald-400", ring: "ring-emerald-500/20" },
  error: { icon: "alertCircle", iconColor: "text-rose-400", ring: "ring-rose-500/20" },
  info: { icon: "info", iconColor: "text-sky-400", ring: "ring-sky-500/20" },
  warning: { icon: "alertTriangle", iconColor: "text-amber-400", ring: "ring-amber-500/20" },
};

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => {
        const style = VARIANT_STYLES[toast.variant];
        return (
          <div
            key={toast.id}
            className={cn(
              "animate-toast-in glass rounded-2xl p-3.5 shadow-2xl shadow-black/40 ring-1 flex items-start gap-3",
              style.ring
            )}
            role="status"
          >
            <div className={cn("flex-shrink-0 mt-0.5", style.iconColor)}>
              <Icon name={style.icon} size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white leading-tight">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Dismiss notification"
            >
              <Icon name="x" size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}