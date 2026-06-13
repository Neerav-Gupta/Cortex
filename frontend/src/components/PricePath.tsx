import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Scenario } from "@/lib/types";

interface PricePathProps {
  scenarios: Scenario[];
  neighborhoodMedian: number;
}

const SCENARIO_COLORS: Record<string, string> = {
  aggressive: "#f87171",
  moderate: "#2dd4bf",
  patient: "#818cf8",
};

const SCENARIO_LABELS: Record<string, string> = {
  aggressive: "Aggressive",
  moderate: "Moderate",
  patient: "Patient",
};

function formatPriceK(value: number): string {
  return `$${Math.round(value / 1000)}k`;
}

export function PricePath({ scenarios, neighborhoodMedian }: PricePathProps) {
  const weeks = Array.from({ length: 13 }, (_, i) => i);
  const chartData = weeks.map((week) => {
    const row: Record<string, number> = { week };
    for (const scenario of scenarios) {
      const point = scenario.price_path.find((p) => p.week === week);
      if (point) {
        row[scenario.id] = point.price;
      }
    }
    return row;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Path Projection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="week"
                domain={[0, 12]}
                type="number"
                ticks={weeks}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                label={{ value: "Week", position: "insideBottom", offset: -5, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickFormatter={formatPriceK}
                domain={["auto", "auto"]}
                width={60}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => formatPriceK(Number(value))}
                labelFormatter={(label) => `Week ${label}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--popover-foreground))",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              />
              <Legend
                formatter={(value: string) => SCENARIO_LABELS[value] ?? value}
                wrapperStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <ReferenceLine
                y={neighborhoodMedian}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                label={{ value: "Neighborhood median", position: "insideTopRight", fill: "hsl(var(--muted-foreground))" }}
              />
              {scenarios.map((scenario) => (
                <Line
                  key={scenario.id}
                  type="monotone"
                  dataKey={scenario.id}
                  name={scenario.id}
                  stroke={SCENARIO_COLORS[scenario.id] ?? "#64748b"}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
