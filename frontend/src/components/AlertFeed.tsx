import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiInsightBadge } from "@/components/AiInsightBadge";
import { cn } from "@/lib/utils";
import type { Alert as AlertType } from "@/lib/types";

interface AlertFeedProps {
  alerts: AlertType[];
  lastUpdated: string;
}

export function AlertFeed({ alerts, lastUpdated }: AlertFeedProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Market Alerts</CardTitle>
          <AiInsightBadge />
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No alerts at this time</p>
        ) : (
          alerts.map((alert, index) => {
            if (alert.severity === "critical") {
              return (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              );
            }

            if (alert.severity === "warning") {
              return (
                <Alert
                  key={index}
                  className="border-l-4 border-l-amber-500 border-y-amber-200 border-r-amber-200 bg-amber-50 dark:bg-amber-950/30"
                >
                  <AlertTriangle className="h-4 w-4 !text-amber-600" />
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              );
            }

            return (
              <Alert key={index} className={cn("border-blue-200 bg-blue-50 dark:bg-blue-950/30")}>
                <Info className="h-4 w-4 !text-blue-600" />
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
