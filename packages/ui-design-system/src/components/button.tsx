"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

// ---------------------------------------------------------------------------
// Variant / size maps
// These classes consume the CSS custom properties defined in tokens.css.
// ---------------------------------------------------------------------------

const variantClasses = {
  primary:
    "bg-[var(--color-tenant-primary)] text-[var(--color-foreground-on-brand)] hover:bg-[var(--color-tenant-primary-hover)] active:bg-[var(--color-tenant-primary-active)] focus-visible:ring-[var(--color-tenant-primary)]",
  secondary:
    "bg-[var(--color-surface-overlay)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border-strong)] focus-visible:ring-[var(--color-brand-primary)]",
  ghost:
    "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-overlay)] focus-visible:ring-[var(--color-brand-primary)]",
  destructive:
    "bg-[var(--color-danger)] text-[var(--color-foreground-on-brand)] hover:opacity-90 active:opacity-80 focus-visible:ring-[var(--color-danger)]",
  link: "bg-transparent text-[var(--color-tenant-primary)] underline-offset-4 hover:underline p-0 h-auto",
} as const;

const sizeClasses = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10 p-0",
} as const;

type ButtonVariant = keyof typeof variantClasses;
type ButtonSize = keyof typeof sizeClasses;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a loading spinner and disables interaction */
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      children,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled ?? loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={[
          // Base
          "inline-flex items-center justify-center rounded-[var(--radius-md)]",
          "font-medium whitespace-nowrap select-none",
          "transition-[background-color,opacity,box-shadow]",
          "duration-[var(--transition-fast)]",
          // Focus ring
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "focus-visible:ring-offset-[var(--color-surface)]",
          // Disabled
          "disabled:pointer-events-none disabled:opacity-50",
          // Variant
          variantClasses[variant],
          // Size
          sizeClasses[size],
          // Caller overrides
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {loading && (
          <svg
            aria-hidden="true"
            className="h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
