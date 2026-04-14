"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { CounterAnalytics } from "@/lib/analytics";

interface Props {
  data: CounterAnalytics;
}

export default function CounterChart({ data }: Props) {
  const { average, median, min, max, stdDev, distribution, total } = data;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3 rounded-lg text-center" style={{ background: "var(--sud-pink-light)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--sud-muted)" }}>Moyenne</p>
          <p className="text-2xl font-bold" style={{ color: "#E60077" }}>{average.toFixed(1)}</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: "#F5F5F5" }}>
          <p className="text-xs font-medium" style={{ color: "var(--sud-muted)" }}>Médiane</p>
          <p className="text-2xl font-bold" style={{ color: "var(--sud-black)" }}>{median.toFixed(1)}</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: "#F5F5F5" }}>
          <p className="text-xs font-medium" style={{ color: "var(--sud-muted)" }}>Min</p>
          <p className="text-2xl font-bold" style={{ color: "var(--sud-black)" }}>{min}</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: "#F5F5F5" }}>
          <p className="text-xs font-medium" style={{ color: "var(--sud-muted)" }}>Max</p>
          <p className="text-2xl font-bold" style={{ color: "var(--sud-black)" }}>{max}</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: "#F5F5F5" }}>
          <p className="text-xs font-medium" style={{ color: "var(--sud-muted)" }}>Écart-type</p>
          <p className="text-2xl font-bold" style={{ color: "var(--sud-black)" }}>{stdDev.toFixed(2)}</p>
        </div>
      </div>

      {/* Distribution chart */}
      <div>
        <h4 className="text-sm font-medium mb-2" style={{ color: "var(--sud-muted)" }}>
          Distribution ({total} réponse{total > 1 ? "s" : ""})
        </h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#666" }} />
            <YAxis allowDecimals={false} tick={{ fill: "#666" }} />
            <Tooltip
              contentStyle={{ background: "white", border: "1px solid #E0E0E0", borderRadius: 8 }}
            />
            <ReferenceLine x={String(Math.round(average))} stroke="#E60077" strokeDasharray="5 5" label={{ value: "Moy.", fill: "#E60077", fontSize: 11 }} />
            <Bar dataKey="count" name="Réponses" fill="#222222" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
