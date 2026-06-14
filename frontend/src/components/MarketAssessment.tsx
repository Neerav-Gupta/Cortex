import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sym } from "@/components/ui/sym";
import { AiInsightBadge } from "@/components/AiInsightBadge";
import type { MarketAssessment as MarketAssessmentType } from "@/lib/types";

interface MarketAssessmentProps {
  assessment: MarketAssessmentType;
}

export function MarketAssessment({ assessment }: MarketAssessmentProps) {
  const items = [
    { icon: "trending_up", label: "Demand trend", value: assessment.demand_trend },
    { icon: "center_focus_strong", label: "Price band fit", value: assessment.price_band_fit },
    { icon: "warning", label: "Key risk", value: assessment.key_risk },
    { icon: "lightbulb", label: "Opportunity", value: assessment.opportunity },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Market assessment</CardTitle>
        <AiInsightBadge />
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {items.map(({ icon, label, value }) => (
          <div key={label} className="space-y-1 rounded border border-rule p-3">
            <p className="fb-eyebrow flex items-center gap-1.5">
              <Sym name={icon} className="text-[16px] text-ink-2" />
              {label}
            </p>
            <p className="text-sm leading-relaxed text-ink">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
