import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sym } from "@/components/ui/sym";
import { AiInsightBadge } from "@/components/AiInsightBadge";
import type { Alert as AlertType } from "@/lib/types";

interface AlertFeedProps {
  alerts: AlertType[];
  lastUpdated: string;
}

const SEVERITY: Record<
  string,
  { icon: string; border: string; text: string }
> = {
  critical: { icon: "report", border: "border-l-crit", text: "text-crit" },
  warning: { icon: "warning", border: "border-l-warn", text: "text-warn" },
  info: { icon: "info", border: "border-l-info", text: "text-info" },
};

export function AlertFeed({ alerts, lastUpdated }: AlertFeedProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Market alerts</CardTitle>
          <AiInsightBadge />
        </div>
        <p className="fb-data text-xs text-ink-2">
          Last updated {new Date(lastUpdated).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-ink-2">No alerts at this time.</p>
        ) : (
          alerts.map((alert, index) => {
            const s = SEVERITY[alert.severity] ?? SEVERITY.info;
            return (
              <div
                key={index}
                className={`flex items-start gap-2 rounded border border-l-2 border-rule bg-paper-2 p-3 ${s.border}`}
              >
                <Sym name={s.icon} className={`mt-0.5 text-[18px] ${s.text}`} />
                <p className="text-sm text-ink">{alert.message}</p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
