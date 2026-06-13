import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PriceHistoryChartProps {
  priceCutHistory: number[];
}

function formatPriceK(value: number): string {
  return `$${Math.round(value / 1000)}k`;
}

export function PriceHistoryChart({ priceCutHistory }: PriceHistoryChartProps) {
  const minPrice = Math.min(...priceCutHistory);
  const yMin = Math.floor((minPrice * 0.95) / 1000) * 1000;

  const data = priceCutHistory.map((price, index) => {
    let label = `Update ${index}`;
    if (index === 0) label = "Original";
    else if (index === priceCutHistory.length - 1) label = "Current";
    else label = `Price cut ${index}`;
    return { label, price };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                tickFormatter={formatPriceK}
                domain={[yMin, "auto"]}
                width={60}
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
              <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={entry.label}
                    fill={index === data.length - 1 ? "#2dd4bf" : "#475569"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
