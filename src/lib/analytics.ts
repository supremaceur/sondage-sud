import type { Answer } from "@/types";

// --- QCM Analytics ---
export interface McqAnalytics {
  options: { name: string; count: number; percentage: number }[];
  topOption: string;
  total: number;
  spread: number; // écart entre le max et le min
}

export function analyzeMcq(answers: Answer[], options: string[]): McqAnalytics {
  const counts: Record<string, number> = {};
  options.forEach((opt) => (counts[opt] = 0));

  answers.forEach((a) => {
    const val = a.value;
    if (Array.isArray(val)) {
      val.forEach((v) => { if (counts[v] !== undefined) counts[v]++; });
    } else if (typeof val === "string" && counts[val] !== undefined) {
      counts[val]++;
    }
  });

  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  const result = options.map((opt) => ({
    name: opt,
    count: counts[opt],
    percentage: total > 0 ? Math.round((counts[opt] / total) * 100) : 0,
  }));

  const max = Math.max(...result.map((r) => r.count));
  const min = Math.min(...result.map((r) => r.count));
  const topOption = result.find((r) => r.count === max)?.name ?? "";

  return { options: result, topOption, total, spread: max - min };
}

// --- Counter Analytics ---
export interface CounterAnalytics {
  average: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  distribution: { name: string; count: number }[];
  total: number;
}

export function analyzeCounter(answers: Answer[]): CounterAnalytics {
  const values = answers.map((a) => Number(a.value)).filter((v) => !isNaN(v));
  const total = values.length;

  if (total === 0) {
    const distribution = Array.from({ length: 11 }, (_, i) => ({ name: String(i), count: 0 }));
    return { average: 0, median: 0, min: 0, max: 0, stdDev: 0, distribution, total: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const average = values.reduce((s, v) => s + v, 0) / total;
  const median = total % 2 === 0
    ? (sorted[total / 2 - 1] + sorted[total / 2]) / 2
    : sorted[Math.floor(total / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const variance = values.reduce((s, v) => s + Math.pow(v - average, 2), 0) / total;
  const stdDev = Math.sqrt(variance);

  const dist: Record<number, number> = {};
  for (let i = 0; i <= 10; i++) dist[i] = 0;
  values.forEach((v) => { if (dist[v] !== undefined) dist[v]++; });
  const distribution = Object.entries(dist).map(([k, v]) => ({ name: k, count: v }));

  return { average, median, min, max, stdDev, distribution, total };
}

// --- Free Text Analytics ---
export interface TextAnalytics {
  wordFrequencies: { word: string; count: number }[];
  sentiment: { positive: number; neutral: number; negative: number };
  totalResponses: number;
  sampleResponses: string[];
}

const STOP_WORDS = new Set([
  "le", "la", "les", "de", "du", "des", "un", "une", "et", "en", "est", "a",
  "je", "tu", "il", "elle", "nous", "vous", "ils", "elles", "ce", "cette",
  "que", "qui", "ne", "pas", "pour", "sur", "dans", "avec", "par", "au",
  "aux", "se", "son", "sa", "ses", "mon", "ma", "mes", "ton", "ta", "tes",
  "mais", "ou", "donc", "car", "ni", "si", "on", "être", "avoir", "faire",
  "plus", "très", "bien", "aussi", "comme", "tout", "tous", "toute", "toutes",
  "ça", "cela", "été", "sont", "ont", "peut", "fait", "dit", "voir",
  "même", "autre", "autres", "entre", "notre", "nos", "leur", "leurs",
  "y", "c", "d", "l", "n", "s", "j", "m", "t", "qu",
]);

const POSITIVE_WORDS = new Set([
  "bien", "bon", "bonne", "excellent", "super", "parfait", "satisfait",
  "content", "contente", "agréable", "positif", "positive", "qualité",
  "bravo", "merci", "top", "formidable", "génial", "efficace", "utile",
  "intéressant", "intéressante", "motivant", "motivante", "encourageant",
  "amélioration", "progrès", "réussite", "succès", "satisfaisant",
  "apprécié", "appréciée", "favorable", "correct", "correcte",
]);

const NEGATIVE_WORDS = new Set([
  "mal", "mauvais", "mauvaise", "nul", "nulle", "problème", "problèmes",
  "difficile", "insuffisant", "insuffisante", "déçu", "déçue", "pire",
  "manque", "absence", "dégradé", "dégradée", "insatisfait", "insatisfaite",
  "lent", "lente", "compliqué", "compliquée", "ennuyeux", "ennuyeuse",
  "inutile", "négatif", "négative", "inadapté", "inadaptée", "médiocre",
  "frustrant", "frustrante", "aucun", "aucune", "jamais", "rien",
]);

export function analyzeText(answers: Answer[]): TextAnalytics {
  const texts = answers.map((a) => String(a.value)).filter((t) => t.trim());
  const totalResponses = texts.length;

  // Word frequencies
  const wordCounts: Record<string, number> = {};
  texts.forEach((text) => {
    const words = text.toLowerCase()
      .replace(/[^a-zàâäéèêëïîôùûüÿçœæ\s-]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    words.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });

  const wordFrequencies = Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  // Sentiment analysis
  let positive = 0, negative = 0, neutral = 0;
  texts.forEach((text) => {
    const words = text.toLowerCase().split(/\s+/);
    let posCount = 0, negCount = 0;
    words.forEach((w) => {
      const clean = w.replace(/[^a-zàâäéèêëïîôùûüÿçœæ]/g, "");
      if (POSITIVE_WORDS.has(clean)) posCount++;
      if (NEGATIVE_WORDS.has(clean)) negCount++;
    });

    if (posCount > negCount) positive++;
    else if (negCount > posCount) negative++;
    else neutral++;
  });

  // Sample responses (longest and most representative)
  const sampleResponses = [...texts]
    .sort((a, b) => b.length - a.length)
    .slice(0, 5);

  return { wordFrequencies, sentiment: { positive, neutral, negative }, totalResponses, sampleResponses };
}
