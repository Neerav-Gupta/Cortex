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
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Recommended Strategy
        </p>
        <AiInsightBadge />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-3xl font-bold">
            {formatCurrency(scenario.recommended_price)}
          </span>
          <Badge>{scenario.label}</Badge>
        </div>

        <p className="text-muted-foreground">{recommendation.one_line_summary}</p>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-semibold">{recommendation.confidence_score}%</span>
          </div>
          <Progress value={recommendation.confidence_score} />
        </div>

        <p className="text-sm leading-relaxed">{recommendation.why_explanation}</p>
      </CardContent>
    </Card>
  );
}
