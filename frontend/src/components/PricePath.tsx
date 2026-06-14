import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTokenColors } from "@/hooks/use-token-colors";
import { SCENARIO_LABELS } from "@/lib/strategy";
import type { Scenario } from "@/lib/types";

interface PricePathProps {
  scenarios: Scenario[];
  neighborhoodMedian: number;
}

const FAIRNESS_FLOOR_RATIO = 0.85;

function formatPriceK(value: number): string {
  return `$${Math.round(value / 1000)}k`;
}

export function PricePath({ scenarios, neighborhoodMedian }: PricePathProps) {
  const c = useTokenColors([
    "--strat-aggressive",
    "--strat-moderate",
    "--strat-patient",
    "--ink-2",
    "--ink-3",
    "--rule",
    "--redline",
    "--redline-weak",
    "--paper-3",
    "--ink",
  ]);

  const strokeFor: Record<string, string> = {
    aggressive: c["--strat-aggressive"],
    moderate: c["--strat-moderate"],
    patient: c["--strat-patient"],
  };

  const weeks = Array.from({ length: 13 }, (_, i) => i);
  const chartData = weeks.map((week) => {
    const row: Record<string, number> = { week };
    for (const scenario of scenarios) {
      const point = scenario.price_path.find((p) => p.week === week);
      if (point) row[scenario.id] = point.price;
    }
    return row;
  });

  const floor = Math.round(neighborhoodMedian * FAIRNESS_FLOOR_RATIO);
  const allPrices = scenarios.flatMap((s) => s.price_path.map((p) => p.price));
  const yMin = Math.floor((Math.min(...allPrices, floor) * 0.97) / 1000) * 1000;
  const yMax = Math.ceil((Math.max(...allPrices, neighborhoodMedian) * 1.03) / 1000) * 1000;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price path projection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                {/* Fairness "restricted zone" hatch — SVG pattern, no gradient. */}
                <pattern
                  id="floorHatch"
                  width="6"
                  height="6"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="6" height="6" fill={c["--redline-weak"]} />
                  <line x1="0" y1="0" x2="0" y2="6" stroke={c["--redline"]} strokeWidth="1" />
                </pattern>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={c["--rule"]} />
              <XAxis
                dataKey="week"
                domain={[0, 12]}
                type="number"
                ticks={weeks}
                stroke={c["--ink-2"]}
                tick={{ fill: c["--ink-2"], fontSize: 12 }}
                label={{ value: "Week", position: "insideBottom", offset: -5, fill: c["--ink-2"] }}
              />
              <YAxis
                tickFormatter={formatPriceK}
                domain={[yMin, yMax]}
                width={60}
                stroke={c["--ink-2"]}
                tick={{ fill: c["--ink-2"], fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => formatPriceK(Number(value))}
                labelFormatter={(label) => `Week ${label}`}
                contentStyle={{
                  backgroundColor: c["--paper-3"],
                  borderColor: c["--rule"],
                  borderRadius: "5px",
                  color: c["--ink"],
                }}
                labelStyle={{ color: c["--ink"] }}
              />
              <Legend
                formatter={(value: string) => SCENARIO_LABELS[value] ?? value}
                wrapperStyle={{ color: c["--ink-2"], fontSize: 12 }}
              />

              {/* Restricted zone: everything below the fairness floor. */}
              <ReferenceArea
                y1={yMin}
                y2={floor}
                fill="url(#floorHatch)"
                fillOpacity={1}
                stroke="none"
              />
              <ReferenceLine
                y={floor}
                stroke={c["--redline"]}
                strokeWidth={1.5}
                label={{
                  value: "Fairness floor (85% of median)",
                  position: "insideBottomRight",
                  fill: c["--redline"],
                  fontSize: 11,
                }}
              />
              <ReferenceLine
                y={neighborhoodMedian}
                stroke={c["--ink-3"]}
                strokeDasharray="4 4"
                label={{
                  value: "Neighborhood median",
                  position: "insideTopRight",
                  fill: c["--ink-3"],
                  fontSize: 11,
                }}
              />

              {scenarios.map((scenario) => (
                <Line
                  key={scenario.id}
                  type="monotone"
                  dataKey={scenario.id}
                  name={scenario.id}
                  stroke={strokeFor[scenario.id] ?? c["--ink-2"]}
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
