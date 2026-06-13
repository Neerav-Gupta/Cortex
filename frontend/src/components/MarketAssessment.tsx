import { AlertTriangle, Lightbulb, TrendingUp, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiInsightBadge } from "@/components/AiInsightBadge";
import type { MarketAssessment as MarketAssessmentType } from "@/lib/types";

interface MarketAssessmentProps {
  assessment: MarketAssessmentType;
}

export function MarketAssessment({ assessment }: MarketAssessmentProps) {
  const items = [
    { icon: TrendingUp, label: "Demand Trend", value: assessment.demand_trend },
    { icon: Target, label: "Price Band Fit", value: assessment.price_band_fit },
    { icon: AlertTriangle, label: "Key Risk", value: assessment.key_risk },
    { icon: Lightbulb, label: "Opportunity", value: assessment.opportunity },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Market Assessment</CardTitle>
        <AiInsightBadge />
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="space-y-1 rounded-lg border border-border/60 p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-primary" />
              {label}
            </p>
            <p className="text-sm leading-relaxed">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
