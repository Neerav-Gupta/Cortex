import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const data = [
    { label: "Original Price", value: originalPrice, color: "#818cf8" },
    { label: "Asking Price", value: currentPrice, color: "#2dd4bf" },
    { label: "Neighborhood Median", value: neighborhoodMedian, color: "#f59e0b" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price vs. Neighborhood Median</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tickFormatter={formatPriceK}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={140}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => formatPriceK(Number(value))}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--popover-foreground))",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
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
