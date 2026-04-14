"use client";

interface Props {
  positive: number;
  neutral: number;
  negative: number;
}

export default function SentimentBar({ positive, neutral, negative }: Props) {
  const total = positive + neutral + negative;
  if (total === 0) return null;

  const pPct = Math.round((positive / total) * 100);
  const neuPct = Math.round((neutral / total) * 100);
  const nPct = Math.round((negative / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex rounded-full overflow-hidden h-3" style={{ background: "#F0F0F0" }}>
        {pPct > 0 && (
          <div
            className="h-full transition-all"
            style={{ width: `${pPct}%`, background: "#4CAF50" }}
            title={`Positif: ${pPct}%`}
          />
        )}
        {neuPct > 0 && (
          <div
            className="h-full transition-all"
            style={{ width: `${neuPct}%`, background: "#FFC107" }}
            title={`Neutre: ${neuPct}%`}
          />
        )}
        {nPct > 0 && (
          <div
            className="h-full transition-all"
            style={{ width: `${nPct}%`, background: "#E60077" }}
            title={`Négatif: ${nPct}%`}
          />
        )}
      </div>
      <div className="flex justify-between text-xs" style={{ color: "var(--sud-muted)" }}>
        <span style={{ color: "#4CAF50" }}>Positif {pPct}%</span>
        <span style={{ color: "#FFC107" }}>Neutre {neuPct}%</span>
        <span style={{ color: "#E60077" }}>Négatif {nPct}%</span>
      </div>
    </div>
  );
}
