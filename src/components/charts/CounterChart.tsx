"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Props {
  average: number;
  distribution: { name: string; count: number }[];
}

export default function CounterChart({ average, distribution }: Props) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-gray-500">Moyenne :</span>
        <span className="text-2xl font-bold" style={{ color: "#E60077" }}>{average.toFixed(1)}</span>
        <span className="text-sm text-gray-400">/ 10</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={distribution}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" name="Réponses" fill="#222222" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
