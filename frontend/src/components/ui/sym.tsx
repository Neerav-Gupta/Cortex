import { cn } from "@/lib/utils";

interface SymProps {
  /** Material Symbols Sharp ligature name, e.g. "home_work", "bolt". */
  name: string;
  /** Filled + heavier weight for active/selected state. */
  active?: boolean;
  /** Large 40px glyph for empty states / rare display use. */
  lg?: boolean;
  /** Dense 20px glyph for tight UI. */
  sm?: boolean;
  className?: string;
}

/**
 * Material Symbols Sharp icon. Renders a ligature span that inherits
 * `currentColor`. Icon-only controls must carry their own aria-label on the
 * surrounding button — the glyph itself is aria-hidden.
 */
export function Sym({ name, active, lg, sm, className }: SymProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "sym",
        active && "sym--active",
        lg && "sym--lg",
        sm && "sym--sm",
        className
      )}
    >
      {name}
    </span>
  );
}
