import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTokenColors } from "@/hooks/use-token-colors";

interface PriceHistoryChartProps {
  priceCutHistory: number[];
}

function formatPriceK(value: number): string {
  return `$${Math.round(value / 1000)}k`;
}

export function PriceHistoryChart({ priceCutHistory }: PriceHistoryChartProps) {
  const c = useTokenColors([
    "--rule-strong",
    "--redline",
    "--ink-2",
    "--rule",
    "--paper-3",
    "--ink",
  ]);

  const minPrice = Math.min(...priceCutHistory);
  const yMin = Math.floor((minPrice * 0.95) / 1000) * 1000;

  const labelFor = (index: number) => {
    if (index === 0) return "Original";
    if (index === priceCutHistory.length - 1) return "Current";
    return `Price cut ${index}`;
  };
  const data = priceCutHistory.map((price, index) => ({
    label: labelFor(index),
    price,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price history</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={c["--rule"]} />
              <XAxis
                dataKey="label"
                stroke={c["--ink-2"]}
                tick={{ fill: c["--ink-2"], fontSize: 12 }}
              />
              <YAxis
                tickFormatter={formatPriceK}
                domain={[yMin, "auto"]}
                width={60}
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
              <Bar dataKey="price" radius={[3, 3, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={entry.label}
                    fill={index === data.length - 1 ? c["--redline"] : c["--rule-strong"]}
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
