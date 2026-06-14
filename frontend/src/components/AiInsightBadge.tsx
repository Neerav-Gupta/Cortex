import { Sym } from "@/components/ui/sym";
import { cn } from "@/lib/utils";

export function AiInsightBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={cn(
        "fb-eyebrow inline-flex items-center gap-1 rounded border border-rule bg-paper-3 px-2 py-0.5 text-ink-2",
        className
      )}
    >
      <Sym name="auto_awesome" className="text-[14px]" />
      AI insight
    </span>
  );
}
