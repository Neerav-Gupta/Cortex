import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AiInsightBadge } from "@/components/AiInsightBadge";
import type { Recommendation, Scenario } from "@/lib/types";

interface StrategyCardProps {
  recommendation: Recommendation;
  scenario: Scenario;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function StrategyCard({ recommendation, scenario }: StrategyCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <p className="fb-eyebrow">Recommended strategy</p>
        <AiInsightBadge />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="fb-data text-4xl font-bold tracking-tight text-ink">
            {formatCurrency(scenario.recommended_price)}
          </span>
          <Badge variant="outline">{scenario.label}</Badge>
        </div>

        <p className="text-ink-2">{recommendation.one_line_summary}</p>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-2">Confidence</span>
            <span className="fb-data font-semibold text-ink">{recommendation.confidence_score}%</span>
          </div>
          <Progress value={recommendation.confidence_score} />
        </div>

        <p className="text-[1.0625rem] leading-relaxed text-ink">{recommendation.why_explanation}</p>
      </CardContent>
    </Card>
  );
}
