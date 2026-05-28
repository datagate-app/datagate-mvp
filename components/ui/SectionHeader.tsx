import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
}: SectionHeaderProps) {
  const wrap = align === "center" ? "mx-auto text-center" : "";
  return (
    <div className={`max-w-3xl ${wrap} ${className}`}>
      <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
        {eyebrow}
      </div>
      <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-ink lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-lg leading-relaxed text-muted">{description}</p>
      )}
    </div>
  );
}
