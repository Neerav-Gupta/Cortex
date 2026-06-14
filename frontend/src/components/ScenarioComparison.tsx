import { Card } from "@/components/ui/card";
import { Sym } from "@/components/ui/sym";
import { cn } from "@/lib/utils";
import { byTemperature, SCENARIO_COLOR_VAR, SCENARIO_ICONS } from "@/lib/strategy";
import type { Scenario } from "@/lib/types";

interface ScenarioComparisonProps {
  scenarios: Scenario[];
  recommendedId: string;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function ScenarioComparison({ scenarios, recommendedId }: ScenarioComparisonProps) {
  const ordered = byTemperature(scenarios);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {ordered.map((scenario) => {
        const isRecommended = scenario.id === recommendedId;
        const colorVar = SCENARIO_COLOR_VAR[scenario.id];
        return (
          <Card
            key={scenario.id}
            className={cn(
              "overflow-hidden p-0",
              isRecommended ? "border-2 border-ink" : "border border-rule"
            )}
          >
            {/* The only chroma on the card: a 3px temperature bar on top. */}
            <div
              className="h-[3px] w-full"
              style={colorVar ? { backgroundColor: `var(${colorVar})` } : undefined}
            />
            <div className="space-y-3 p-5">
              {isRecommended && <p className="fb-eyebrow text-ink">Recommended</p>}
              <div className="flex items-center gap-2">
                <Sym name={SCENARIO_ICONS[scenario.id] ?? "equalizer"} active={isRecommended} sm />
                <h3 className="text-base font-semibold text-ink">{scenario.label}</h3>
              </div>

              <p className="fb-data text-3xl font-bold text-ink">
                {formatCurrency(scenario.recommended_price)}
              </p>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-2">Est. days to sale</span>
                  <span className="fb-data font-medium text-ink">{scenario.estimated_days_to_sale}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-2">Equity retained</span>
                  <span className="fb-data font-medium text-ok">{scenario.equity_retained_pct}%</span>
                </div>
              </div>

              {scenario.incentives.length > 0 && (
                <ul className="list-disc space-y-1 pl-4 text-sm text-ink-2">
                  {scenario.incentives.map((incentive) => (
                    <li key={incentive}>{incentive}</li>
                  ))}
                </ul>
              )}

              <p className="text-xs text-ink-2">{scenario.rationale}</p>

              {!scenario.fairness_passed && (
                <div className="flex items-start gap-2 rounded border-l-2 border-l-warn bg-paper-3 p-2 text-sm text-ink">
                  <Sym name="warning" className="mt-0.5 text-[18px] text-warn" />
                  <span>{scenario.flag_reason}</span>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
