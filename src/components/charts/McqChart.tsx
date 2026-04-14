"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import type { McqAnalytics } from "@/lib/analytics";

const COLORS = ["#E60077", "#FFF59D", "#222222", "#F48FB1", "#FFF9C4", "#888888", "#F06292", "#FFFDE7"];

interface Props {
  data: McqAnalytics;
}

export default function McqChart({ data }: Props) {
  const { options, topOption, total, spread } = data;

  return (
    <div className="space-y-4">
      {/* Top option highlight */}
      <div className="flex flex-wrap gap-3">
        <div
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: "var(--sud-pink-light)", color: "#E60077" }}
        >
          Option favorite : <strong>{topOption}</strong>
        </div>
        <div
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: "#F5F5F5", color: "var(--sud-muted)" }}
        >
          {total} vote{total > 1 ? "s" : ""} — écart : {spread}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div>
          <h4 className="text-sm font-medium mb-2" style={{ color: "var(--sud-muted)" }}>Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={options}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#666" }} />
              <YAxis allowDecimals={false} tick={{ fill: "#666" }} />
              <Tooltip
                contentStyle={{ background: "white", border: "1px solid #E0E0E0", borderRadius: 8 }}
                formatter={(value: unknown) => {
                  return [`${value}`, "Réponses"];
                }}
              />
              <Bar dataKey="count" name="Réponses" radius={[6, 6, 0, 0]}>
                {options.map((opt, i) => (
                  <Cell
                    key={i}
                    fill={opt.name === topOption ? "#E60077" : "#E0E0E0"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div>
          <h4 className="text-sm font-medium mb-2" style={{ color: "var(--sud-muted)" }}>Répartition</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={options.filter((d) => d.count > 0)}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name} (${total > 0 ? Math.round(((value as number) / total) * 100) : 0}%)`}
                labelLine
              >
                {options.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "white", border: "1px solid #E0E0E0", borderRadius: 8 }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed table */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--sud-border)" }}>
        <table className="w-full text-sm">
          <thead style={{ background: "#FAFAFA" }}>
            <tr>
              <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--sud-muted)" }}>Option</th>
              <th className="text-right px-3 py-2 font-medium" style={{ color: "var(--sud-muted)" }}>Votes</th>
              <th className="text-right px-3 py-2 font-medium" style={{ color: "var(--sud-muted)" }}>%</th>
              <th className="px-3 py-2" style={{ color: "var(--sud-muted)" }}>Barre</th>
            </tr>
          </thead>
          <tbody>
            {options.map((opt) => (
              <tr key={opt.name} style={{ borderTop: "1px solid var(--sud-border)" }}>
                <td className="px-3 py-2 font-medium" style={{ color: opt.name === topOption ? "#E60077" : "var(--sud-black)" }}>
                  {opt.name}
                </td>
                <td className="px-3 py-2 text-right" style={{ color: "var(--sud-dark)" }}>{opt.count}</td>
                <td className="px-3 py-2 text-right font-medium" style={{ color: "var(--sud-dark)" }}>{opt.percentage}%</td>
                <td className="px-3 py-2" style={{ width: "40%" }}>
                  <div className="w-full rounded-full h-2" style={{ background: "#F0F0F0" }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${opt.percentage}%`,
                        background: opt.name === topOption ? "#E60077" : "#CCC",
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
