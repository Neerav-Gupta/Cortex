import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AiInsightBadge({ className = "" }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={`gap-1 border-primary/40 bg-primary/10 text-primary ${className}`}
    >
      <Sparkles className="h-3 w-3" />
      AI Insight
    </Badge>
  );
}
