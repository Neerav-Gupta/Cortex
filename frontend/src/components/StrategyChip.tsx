import { Sym } from "@/components/ui/sym";
import { cn } from "@/lib/utils";
import { SCENARIO_BORDER_CLASS, SCENARIO_ICONS, SCENARIO_LABELS } from "@/lib/strategy";

interface StrategyChipProps {
  id: string;
  price?: number;
  className?: string;
}

/** Temperature chip: a tag with a left border in the strategy color (§6.6). */
export function StrategyChip({ id, price, className }: StrategyChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border border-l-2 border-rule bg-paper-3 px-2 py-0.5 text-xs",
        SCENARIO_BORDER_CLASS[id] ?? "border-l-ink",
        className
      )}
    >
      <Sym name={SCENARIO_ICONS[id] ?? "equalizer"} className="text-[16px] text-ink-2" />
      <span className="font-medium text-ink">{SCENARIO_LABELS[id] ?? id}</span>
      {price != null && (
        <span className="fb-data text-ink-2">${price.toLocaleString()}</span>
      )}
    </span>
  );
}
