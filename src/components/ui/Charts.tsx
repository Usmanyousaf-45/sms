import { cn } from "@/lib/utils";

// =============================================================================
// CSS-ONLY CHARTS
// No chart library — pure div/SVG with computed heights/angles. Used by the
// dashboard and later by Reports.
// =============================================================================

const COLOR_MAP: Record<string, string> = {
  sky: "bg-sky-500", violet: "bg-violet-500", amber: "bg-amber-500", emerald: "bg-emerald-500",
  rose: "bg-rose-500", cyan: "bg-cyan-500", orange: "bg-orange-500", lime: "bg-lime-500",
  fuchsia: "bg-fuchsia-500", teal: "bg-teal-500", red: "bg-red-500", pink: "bg-pink-500",
  indigo: "bg-indigo-500",
};

// -----------------------------------------------------------------------------
// Bar Chart (vertical)
// -----------------------------------------------------------------------------

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  height?: number;
  suffix?: string;
}

export function BarChart({ data, maxValue, height = 160, suffix = "%" }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.max((d.value / max) * 100, 4);
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-2 group">
            <span className="text-[11px] text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              {d.value}{suffix}
            </span>
            <div className="w-full flex-1 flex items-end">
              <div
                className={cn(
                  "w-full rounded-t-lg transition-all duration-700 ease-out animate-slide-up",
                  COLOR_MAP[d.color ?? "indigo"] ?? "bg-indigo-500",
                  "opacity-80 group-hover:opacity-100"
                )}
                style={{ height: `${pct}%`, animationDelay: `${i * 60}ms` }}
              />
            </div>
            <span className="text-[11px] text-slate-500">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Donut Chart (conic-gradient based)
// -----------------------------------------------------------------------------

interface DonutSegment {
  label: string;
  value: number;
  colorHex: string;
}

export function DonutChart({ segments, size = 140, thickness = 18 }: { segments: DonutSegment[]; size?: number; thickness?: number }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  let cumulative = 0;
  const stops = segments.map((s) => {
    const start = (cumulative / total) * 360;
    cumulative += s.value;
    const end = (cumulative / total) * 360;
    return `${s.colorHex} ${start}deg ${end}deg`;
  });

  return (
    <div className="flex items-center gap-5">
      <div
        className="rounded-full flex-shrink-0 relative"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${stops.join(", ")})`,
        }}
      >
        <div
          className="absolute rounded-full bg-slate-950 flex items-center justify-center"
          style={{ inset: thickness }}
        >
          <span className="text-lg font-semibold text-white">{total}</span>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.colorHex }} />
            <span className="text-slate-400">{s.label}</span>
            <span className="text-white font-medium">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Horizontal progress bar (mini bar chart row)
// -----------------------------------------------------------------------------

export function ProgressRow({ label, value, color = "indigo", suffix = "%" }: { label: string; value: number; color?: string; suffix?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs text-white font-medium">{value}{suffix}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", COLOR_MAP[color] ?? "bg-indigo-500")}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}