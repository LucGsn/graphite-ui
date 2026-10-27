import * as React from "react";
import { cn } from "../lib/cn";
import { buttonVariants, type ButtonProps } from "./button";

export interface IconButtonProps extends Omit<ButtonProps, "size" | "children"> {
  /** Obligatoire : un bouton sans texte doit porter une étiquette accessible. */
  label: string;
  children: React.ReactNode;
}

/** Bouton carré (36 px) pour une icône seule. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, className, variant = "ghost", children, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(buttonVariants({ variant }), "size-9 px-0", className)}
      {...props}
    >
      {children}
    </button>
  ),
);
IconButton.displayName = "IconButton";
