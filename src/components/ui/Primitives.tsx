import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

// =============================================================================
// STAT CARD
// =============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: IconName;
  trend?: { value: number; direction: "up" | "down" };
  accent?: "indigo" | "emerald" | "amber" | "rose" | "sky";
  className?: string;
}

const ACCENT_STYLES: Record<NonNullable<StatCardProps["accent"]>, { bg: string; text: string; ring: string }> = {
  indigo: { bg: "from-indigo-500/15 to-violet-500/10", text: "text-indigo-300", ring: "ring-indigo-500/20" },
  emerald: { bg: "from-emerald-500/15 to-teal-500/10", text: "text-emerald-300", ring: "ring-emerald-500/20" },
  amber: { bg: "from-amber-500/15 to-orange-500/10", text: "text-amber-300", ring: "ring-amber-500/20" },
  rose: { bg: "from-rose-500/15 to-pink-500/10", text: "text-rose-300", ring: "ring-rose-500/20" },
  sky: { bg: "from-sky-500/15 to-cyan-500/10", text: "text-sky-300", ring: "ring-sky-500/20" },
};

export function StatCard({ label, value, icon, trend, accent = "indigo", className }: StatCardProps) {
  const styles = ACCENT_STYLES[accent];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:bg-white/[0.045] hover:-translate-y-0.5 transition-all duration-200 group",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center ring-1", styles.bg, styles.ring, styles.text)}>
          <Icon name={icon} size={18} />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              trend.direction === "up" ? "text-emerald-300 bg-emerald-500/10" : "text-rose-300 bg-rose-500/10"
            )}
          >
            <Icon name={trend.direction === "up" ? "trendingUp" : "trendingDown"} size={12} />
            {trend.value}%
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-white mt-4 tracking-tight">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

// =============================================================================
// BADGE / STATUS CHIP
// =============================================================================

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "indigo";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  success: "bg-emerald-500/12 text-emerald-300 ring-emerald-500/25",
  warning: "bg-amber-500/12 text-amber-300 ring-amber-500/25",
  error: "bg-rose-500/12 text-rose-300 ring-rose-500/25",
  info: "bg-sky-500/12 text-sky-300 ring-sky-500/25",
  neutral: "bg-slate-500/12 text-slate-300 ring-slate-500/25",
  indigo: "bg-indigo-500/12 text-indigo-300 ring-indigo-500/25",
};

export function Badge({ children, variant = "neutral", className }: { children: ReactNode; variant?: BadgeVariant; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1",
        BADGE_STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// =============================================================================
// CARD (generic panel wrapper)
// =============================================================================

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}