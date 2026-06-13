import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { GuardrailConfig, Scenario } from "@/lib/types";

interface FairnessPanelProps {
  scenarios: Scenario[];
  guardrails: GuardrailConfig;
}

export function FairnessPanel({ scenarios, guardrails }: FairnessPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fairness Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Recommendations are checked against community guardrails before being
          shown.
        </p>

        <div className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Minimum price floor:</span>{" "}
            {(guardrails.floor_ratio * 100).toFixed(0)}% of neighborhood median
          </p>
          <p>
            <span className="font-medium">Maximum discount cap:</span>{" "}
            {guardrails.max_discount_pct}% from original list price
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{scenario.label}</span>
                {scenario.fairness_passed ? (
                  <Badge className="bg-green-600 hover:bg-green-600">Passed</Badge>
                ) : (
                  <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500">
                    Flagged
                  </Badge>
                )}
              </div>
              {!scenario.fairness_passed && scenario.flag_reason && (
                <p className="text-xs text-muted-foreground">{scenario.flag_reason}</p>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Flagged recommendations require advisor review before applying.
        </p>
      </CardContent>
    </Card>
  );
}
