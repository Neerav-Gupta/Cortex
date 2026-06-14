import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sym } from "@/components/ui/sym";
import type { GuardrailConfig, Scenario } from "@/lib/types";

interface FairnessPanelProps {
  scenarios: Scenario[];
  guardrails: GuardrailConfig;
}

export function FairnessPanel({ scenarios, guardrails }: FairnessPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fairness check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-ink-2">
          Recommendations are checked against community guardrails before being shown.
        </p>

        <div className="space-y-2 text-sm text-ink">
          <p className="flex items-center gap-2">
            <Sym name="shield" className="text-[18px] text-ink-2" />
            <span>
              Floor: {(guardrails.floor_ratio * 100).toFixed(0)}% of neighborhood median
            </span>
          </p>
          <p className="flex items-center gap-2">
            <Sym name="shield" className="text-[18px] text-ink-2" />
            <span>Max cut: {guardrails.max_discount_pct}% of original list price</span>
          </p>
        </div>

        <Separator className="bg-rule" />

        <div className="space-y-2">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{scenario.label}</span>
                {scenario.fairness_passed ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-ok">
                    <Sym name="check_circle" className="text-[16px]" /> Passed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm font-medium text-warn">
                    <Sym name="warning" className="text-[16px]" /> Flagged
                  </span>
                )}
              </div>
              {!scenario.fairness_passed && scenario.flag_reason && (
                <p className="text-xs text-ink-2">{scenario.flag_reason}</p>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-ink-2">
          Flagged recommendations require advisor review before applying.
        </p>
      </CardContent>
    </Card>
  );
}
