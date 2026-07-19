"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

// =============================================================================
// BUTTON
// =============================================================================

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: "left" | "right";
  loading?: boolean;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-px active:translate-y-0 border border-indigo-400/20",
  secondary:
    "bg-white/10 text-white border border-white/10 hover:bg-white/15 backdrop-blur-sm",
  ghost:
    "bg-transparent text-slate-300 hover:bg-white/5 hover:text-white",
  danger:
    "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-600/25 hover:shadow-rose-600/40 border border-rose-400/20",
  outline:
    "bg-transparent border border-white/15 text-white hover:bg-white/5",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 gap-2 rounded-xl",
  lg: "text-sm px-6 py-3 gap-2 rounded-xl",
  icon: "p-2.5 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      loading,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 whitespace-nowrap select-none",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Icon name="loader" size={size === "sm" ? 14 : 16} className="animate-spin" />
        ) : (
          icon &&
          iconPosition === "left" && <Icon name={icon} size={size === "sm" ? 14 : 16} />
        )}
        {children}
        {!loading && icon && iconPosition === "right" && (
          <Icon name={icon} size={size === "sm" ? 14 : 16} />
        )}
      </button>
    );
  }
);
Button.displayName = "Button";