import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTokenColors } from "@/hooks/use-token-colors";

interface NeighborhoodComparisonChartProps {
  currentPrice: number;
  originalPrice: number;
  neighborhoodMedian: number;
}

function formatPriceK(value: number): string {
  return `$${Math.round(value / 1000)}k`;
}

export function NeighborhoodComparisonChart({
  currentPrice,
  originalPrice,
  neighborhoodMedian,
}: NeighborhoodComparisonChartProps) {
  const c = useTokenColors([
    "--ink-3",
    "--redline",
    "--ink",
    "--ink-2",
    "--rule",
    "--paper-3",
  ]);

  const data = [
    { label: "Original price", value: originalPrice, color: c["--ink-3"] },
    { label: "Asking price", value: currentPrice, color: c["--redline"] },
    { label: "Neighborhood median", value: neighborhoodMedian, color: c["--ink"] },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price vs. neighborhood median</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={c["--rule"]} />
              <XAxis
                type="number"
                tickFormatter={formatPriceK}
                stroke={c["--ink-2"]}
                tick={{ fill: c["--ink-2"], fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={140}
                stroke={c["--ink-2"]}
                tick={{ fill: c["--ink-2"], fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => formatPriceK(Number(value))}
                contentStyle={{
                  backgroundColor: c["--paper-3"],
                  borderColor: c["--rule"],
                  borderRadius: "5px",
                  color: c["--ink"],
                }}
                labelStyle={{ color: c["--ink"] }}
                cursor={{ fill: c["--rule"], fillOpacity: 0.3 }}
              />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
