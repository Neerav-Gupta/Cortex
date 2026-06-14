// Shared strategy metadata: temperature order, labels, icons, and the CSS
// variable that holds each strategy's chroma. Charts resolve the var to a
// concrete color via use-token-colors; component markup uses the static
// Tailwind classes below.

export const SCENARIO_ORDER = ["aggressive", "moderate", "patient"] as const;

export const SCENARIO_LABELS: Record<string, string> = {
  aggressive: "Aggressive",
  moderate: "Moderate",
  patient: "Patient",
};

// Material Symbols Sharp ligature per strategy.
export const SCENARIO_ICONS: Record<string, string> = {
  aggressive: "bolt",
  moderate: "equalizer",
  patient: "schedule",
};

// CSS custom property holding each strategy color (resolved for charts).
export const SCENARIO_COLOR_VAR: Record<string, string> = {
  aggressive: "--strat-aggressive",
  moderate: "--strat-moderate",
  patient: "--strat-patient",
};

// Static Tailwind classes (so the JIT compiler can see them) for the
// temperature chip's left accent border.
export const SCENARIO_BORDER_CLASS: Record<string, string> = {
  aggressive: "border-l-strat-aggressive",
  moderate: "border-l-strat-moderate",
  patient: "border-l-strat-patient",
};

/** Sort scenarios into temperature order Aggressive → Moderate → Patient. */
export function byTemperature<T extends { id: string }>(scenarios: T[]): T[] {
  const rank = (id: string) => {
    const i = SCENARIO_ORDER.indexOf(id as (typeof SCENARIO_ORDER)[number]);
    return i === -1 ? SCENARIO_ORDER.length : i;
  };
  return [...scenarios].sort((a, b) => rank(a.id) - rank(b.id));
}
