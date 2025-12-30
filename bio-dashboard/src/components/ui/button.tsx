"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Manpasik Nebula Button Component
 * Features: Gradient primary, ghost hover, tap effects, inner glow
 */

const buttonVariants = cva(
  // Base styles with Nebula design
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap text-sm font-medium",
    "rounded-xl",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary: Gradient with inner glow
        default: [
          "relative overflow-hidden",
          "bg-gradient-to-r from-[#0ea5e9] to-[#2563eb]",
          "text-white font-semibold",
          "shadow-nebula",
          "hover:shadow-nebula-glow hover:-translate-y-0.5",
          // Inner glow overlay
          "before:absolute before:inset-0",
          "before:bg-gradient-to-t before:from-transparent before:via-white/10 before:to-white/20",
          "before:opacity-0 before:transition-opacity before:duration-200",
          "hover:before:opacity-100",
        ].join(" "),
        
        // Secondary: Teal gradient
        secondary: [
          "relative overflow-hidden",
          "bg-gradient-to-r from-[#14b8a6] to-[#0d9488]",
          "text-white font-semibold",
          "shadow-nebula",
          "hover:shadow-nebula-teal-glow hover:-translate-y-0.5",
        ].join(" "),
        
        // Outline: Border with hover fill
        outline: [
          "border-2 border-slate-200 dark:border-slate-700",
          "bg-transparent",
          "text-slate-700 dark:text-slate-300",
          "hover:bg-slate-100 dark:hover:bg-slate-800",
          "hover:border-slate-300 dark:hover:border-slate-600",
        ].join(" "),
        
        // Ghost: Transparent with hover background
        ghost: [
          "text-slate-600 dark:text-slate-400",
          "hover:bg-slate-100 dark:hover:bg-slate-800",
          "hover:text-slate-900 dark:hover:text-slate-100",
        ].join(" "),
        
        // Destructive: Rose gradient
        destructive: [
          "relative overflow-hidden",
          "bg-gradient-to-r from-[#f43f5e] to-[#e11d48]",
          "text-white font-semibold",
          "shadow-nebula",
          "hover:shadow-nebula-rose-glow hover:-translate-y-0.5",
        ].join(" "),
        
        // Link: Text only
        link: [
          "text-primary underline-offset-4",
          "hover:underline",
        ].join(" "),
        
        // Glass: Glassmorphism button
        glass: [
          "bg-white/80 dark:bg-slate-800/80",
          "backdrop-blur-[8px]",
          "border border-white/50 dark:border-slate-700/50",
          "text-slate-700 dark:text-slate-200",
          "shadow-nebula-sm",
          "hover:bg-white/90 dark:hover:bg-slate-800/90",
          "hover:shadow-nebula",
        ].join(" "),
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Loading state with spinner */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
