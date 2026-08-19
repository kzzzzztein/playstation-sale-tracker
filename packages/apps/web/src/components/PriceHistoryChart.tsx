import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { PriceHistoryEntry } from "@pst/types";
import { formatCurrency } from "@pst/shared";

export function PriceHistoryChart({ history, currency }: { history: PriceHistoryEntry[]; currency: string }) {
  const data = history.map((h) => ({
    date: new Date(h.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    price: h.price,
  }));

  if (data.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-surface-border bg-surface-raised text-sm text-zinc-500">
        Not enough price history yet to draw a chart.
      </div>
    );
  }

  return (
    <div className="h-56 rounded-xl border border-surface-border bg-surface-raised p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#232329" vertical={false} />
          <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v) => formatCurrency(v, currency)}
          />
          <Tooltip
            contentStyle={{ background: "#131317", border: "1px solid #232329", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(value: number) => [formatCurrency(value, currency), "Price"]}
          />
          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
