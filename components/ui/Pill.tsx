import type { ReactNode } from "react";

interface PillProps {
  children: ReactNode;
  tone?: "default" | "success" | "amber" | "blue" | "dark";
  dot?: boolean;
  className?: string;
}

const toneClasses: Record<NonNullable<PillProps["tone"]>, string> = {
  default: "bg-white text-navy hairline",
  success: "bg-success/10 text-success border border-success/25",
  amber: "bg-amber/10 text-amber border border-amber/25",
  blue: "bg-blue/10 text-blue border border-blue/25",
  dark: "bg-white/10 text-white border border-white/20",
};

const dotColor: Record<NonNullable<PillProps["tone"]>, string> = {
  default: "bg-success",
  success: "bg-success",
  amber: "bg-amber",
  blue: "bg-blue",
  dark: "bg-success",
};

export function Pill({ children, tone = "default", dot = false, className = "" }: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm ${toneClasses[tone]} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColor[tone]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
