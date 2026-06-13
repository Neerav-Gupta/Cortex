import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {scenarios.map((scenario) => (
        <Card
          key={scenario.id}
          className={cn(
            scenario.id === recommendedId && "ring-2 ring-teal-600"
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{scenario.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-semibold">
              {formatCurrency(scenario.recommended_price)}
            </p>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. days to sale</span>
                <span className="font-medium">{scenario.estimated_days_to_sale}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equity retained</span>
                <span className="font-medium">{scenario.equity_retained_pct}%</span>
              </div>
            </div>

            {scenario.incentives.length > 0 && (
              <ul className="list-disc space-y-1 pl-4 text-sm">
                {scenario.incentives.map((incentive) => (
                  <li key={incentive}>{incentive}</li>
                ))}
              </ul>
            )}

            <p className="text-xs text-muted-foreground">{scenario.rationale}</p>

            {!scenario.fairness_passed && (
              <Alert className="border-yellow-500/50 bg-yellow-50 text-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4 !text-yellow-600" />
                <AlertDescription>{scenario.flag_reason}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
