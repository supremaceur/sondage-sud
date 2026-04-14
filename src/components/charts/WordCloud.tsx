"use client";

interface Props {
  words: { word: string; count: number }[];
}

const COLORS = ["#E60077", "#222222", "#F48FB1", "#666666", "#E60077", "#333333"];

export default function WordCloud({ words }: Props) {
  if (words.length === 0) return null;

  const maxCount = words[0]?.count ?? 1;

  return (
    <div className="flex flex-wrap gap-2 items-center justify-center py-4">
      {words.map((w, i) => {
        const ratio = w.count / maxCount;
        const fontSize = Math.max(12, Math.round(ratio * 32 + 10));
        const opacity = Math.max(0.4, ratio);

        return (
          <span
            key={w.word}
            className="inline-block px-1 font-medium transition-transform hover:scale-110 cursor-default"
            style={{
              fontSize: `${fontSize}px`,
              color: COLORS[i % COLORS.length],
              opacity,
            }}
            title={`${w.word}: ${w.count} occurrence${w.count > 1 ? "s" : ""}`}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
}
