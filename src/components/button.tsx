import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/**
 * Bouton : 36 px, fond « champ » (blanc 4,5 %), bordure blanc 15 %, arrondi 6 px, texte 14/500.
 * `primary` est le seul bouton plein : un par écran au plus.
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-input bg-field text-foreground hover:bg-foreground/10",
        primary: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        ghost: "border-transparent bg-transparent text-muted hover:bg-accent/60 hover:text-foreground",
      },
      size: {
        md: "h-9 px-3",
        sm: "h-8 px-2.5 text-[13px]",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
