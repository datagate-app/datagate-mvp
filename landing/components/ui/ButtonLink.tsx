import type { AnchorHTMLAttributes, ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "light";
type Size = "md" | "lg";

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  withArrow?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-ink text-white hover:bg-navy shadow-soft",
  secondary:
    "bg-white text-ink hairline hover:border-ink/30",
  ghost: "text-ink/80 hover:text-ink",
  light: "bg-white text-ink hover:bg-bg shadow-soft",
};

const sizeClasses: Record<Size, string> = {
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3.5 text-base",
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  withArrow = false,
  className = "",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a
      {...props}
      className={`group inline-flex items-center justify-center gap-2 rounded-lg font-medium transition ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
      {withArrow && (
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 transition group-hover:translate-x-0.5"
        />
      )}
    </a>
  );
}
