"use client";

import { forwardRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

// =============================================================================
// INPUT
// =============================================================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: IconName;
  error?: string;
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, label, hint, className, id, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputId = id ?? props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Icon name={icon} size={17} />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? "text" : type}
            className={cn(
              "w-full bg-white/5 border rounded-xl text-white placeholder:text-slate-500 transition-all duration-150 outline-none",
              "py-2.5 text-sm",
              icon ? "pl-11" : "pl-3.5",
              isPassword ? "pr-11" : "pr-3.5",
              error
                ? "border-rose-500/60 focus:border-rose-500"
                : "border-white/10 focus:border-indigo-400/60 focus:bg-white/[0.07]",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <Icon name={showPassword ? "eye" : "eye"} size={17} />
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
            <Icon name="alertCircle" size={12} />
            {error}
          </p>
        )}
        {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// =============================================================================
// SELECT
// =============================================================================

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  className?: string;
}

export function Select({ label, value, onChange, options, placeholder, error, className }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full appearance-none bg-white/5 border rounded-xl text-white py-2.5 pl-3.5 pr-10 text-sm outline-none transition-all duration-150 cursor-pointer",
            error ? "border-rose-500/60" : "border-white/10 focus:border-indigo-400/60 focus:bg-white/[0.07]",
            className
          )}
        >
          {placeholder && (
            <option value="" disabled className="bg-slate-900">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          <Icon name="chevronDown" size={16} />
        </div>
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

// =============================================================================
// CHECKBOX
// =============================================================================

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  id?: string;
}

export function Checkbox({ checked, onChange, label, id }: CheckboxProps) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "w-[18px] h-[18px] rounded-md border flex items-center justify-center transition-all duration-150 flex-shrink-0",
          checked
            ? "bg-indigo-500 border-indigo-500"
            : "bg-white/5 border-white/20 group-hover:border-white/35"
        )}
      >
        {checked && <Icon name="check" size={12} className="text-white" strokeWidth={3} />}
      </button>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </label>
  );
}