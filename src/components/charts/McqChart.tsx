"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// Palette SUD P2ST : rose vif, jaune pastel, noir + variantes
const COLORS = ["#E60077", "#FFF59D", "#222222", "#F48FB1", "#FFF9C4", "#555555", "#F06292", "#FFFDE7"];

interface Props {
  data: { name: string; count: number }[];
}

export default function McqChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Graphique en barres */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Distribution</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="Réponses" fill="#E60077" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Camembert */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Répartition</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data.filter((d) => d.count > 0)}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }) => `${name} (${Math.round(((value as number) / total) * 100)}%)`}
              labelLine
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
