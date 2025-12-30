"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Manpasik Nebula Card Component
 * Features: Glassmorphism, subtle borders, smooth hover transitions
 */

export interface CardProps extends React.ComponentPropsWithoutRef<"div"> {
  /** Glassmorphism variant with backdrop blur */
  glass?: boolean;
  /** Elevated variant with stronger shadow */
  elevated?: boolean;
  /** Interactive with hover scale effect */
  interactive?: boolean;
  /** Glow effect on hover */
  glow?: "primary" | "teal" | "rose";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = false, elevated = false, interactive = false, glow, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Base styles
        "rounded-2xl border bg-card text-card-foreground",
        "transition-all duration-300 ease-out",
        
        // Default shadow
        !elevated && "shadow-nebula-sm",
        
        // Glass variant
        glass && [
          "bg-white/85 dark:bg-slate-900/50",
          "backdrop-blur-[12px]",
          "border-white/50 dark:border-slate-700/50",
        ],
        
        // Elevated variant
        elevated && "shadow-nebula-lg",
        
        // Interactive hover effect
        interactive && [
          "cursor-pointer",
          "hover:shadow-nebula-lg hover:-translate-y-0.5 hover:scale-[1.01]",
          "active:scale-[0.99] active:translate-y-0",
        ],
        
        // Glow effects
        glow === "primary" && "hover:shadow-nebula-glow",
        glow === "teal" && "hover:shadow-nebula-teal-glow",
        glow === "rose" && "hover:shadow-nebula-rose-glow",
        
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("flex flex-col space-y-1.5 p-5", className)} 
    {...props} 
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<"h3">
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      "text-slate-900 dark:text-slate-100",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => (
  <p 
    ref={ref} 
    className={cn("text-sm text-muted-foreground", className)} 
    {...props} 
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "flex items-center p-5 pt-0",
      "border-t border-slate-100 dark:border-slate-800 mt-4 pt-4",
      className
    )} 
    {...props} 
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
