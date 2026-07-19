"use client";

import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

// =============================================================================
// MULTI-SELECT (chip toggle grid)
// Used for subject assignment (Teachers), and reusable anywhere a many-to-many
// relationship needs a compact picker (e.g. class subjects, event tags).
// =============================================================================

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
}

export function MultiSelect({ label, options, selected, onChange, error }: MultiSelectProps) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                isSelected
                  ? "bg-indigo-500/15 border-indigo-400/50 text-indigo-200"
                  : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-slate-300"
              )}
            >
              {isSelected && <Icon name="check" size={11} />}
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
          <Icon name="alertCircle" size={12} />
          {error}
        </p>
      )}
    </div>
  );
}
