import * as XLSX from "xlsx";
import type { Survey, Question, Answer } from "@/types";
import { analyzeMcq, analyzeCounter, analyzeText } from "./analytics";

interface ExportData {
  survey: Survey;
  questions: Question[];
  answers: Answer[];
  totalResponses: number;
  siteName?: string;
}

export function exportToExcel({ survey, questions, answers, totalResponses, siteName }: ExportData) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Résumé
  const summaryData = [
    ["Sondage", survey.title],
    ["Description", survey.description || "—"],
    ["Site", siteName || "Tous"],
    ["Nombre de réponses", totalResponses],
    ["Date de création", new Date(survey.created_at).toLocaleDateString("fr-FR")],
    ["Statut", survey.is_active ? "Actif" : "Inactif"],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 25 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Résumé");

  // Sheet 2: Données brutes
  const rawHeaders = ["Question", "Type", "Réponse"];
  const rawRows: (string | number)[][] = [];
  questions.forEach((q) => {
    const qAnswers = answers.filter((a) => a.question_id === q.id);
    qAnswers.forEach((a) => {
      const value = Array.isArray(a.value) ? a.value.join(", ") : String(a.value);
      rawRows.push([q.title, q.type, value]);
    });
  });
  const wsRaw = XLSX.utils.aoa_to_sheet([rawHeaders, ...rawRows]);
  wsRaw["!cols"] = [{ wch: 40 }, { wch: 15 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsRaw, "Données brutes");

  // Sheet 3: Agrégations
  const aggHeaders = ["Question", "Type", "Métrique", "Valeur"];
  const aggRows: (string | number)[][] = [];

  questions.forEach((q) => {
    const qAnswers = answers.filter((a) => a.question_id === q.id);

    if ((q.type === "mcq_single" || q.type === "mcq_multiple") && q.options) {
      const analysis = analyzeMcq(qAnswers, q.options);
      analysis.options.forEach((opt) => {
        aggRows.push([q.title, q.type, `${opt.name} — votes`, opt.count]);
        aggRows.push([q.title, q.type, `${opt.name} — %`, opt.percentage]);
      });
      aggRows.push([q.title, q.type, "Option favorite", analysis.topOption]);
    }

    if (q.type === "counter") {
      const analysis = analyzeCounter(qAnswers);
      aggRows.push([q.title, q.type, "Moyenne", Number(analysis.average.toFixed(2))]);
      aggRows.push([q.title, q.type, "Médiane", analysis.median]);
      aggRows.push([q.title, q.type, "Min", analysis.min]);
      aggRows.push([q.title, q.type, "Max", analysis.max]);
      aggRows.push([q.title, q.type, "Écart-type", Number(analysis.stdDev.toFixed(2))]);
    }

    if (q.type === "free_text") {
      const analysis = analyzeText(qAnswers);
      aggRows.push([q.title, q.type, "Réponses", analysis.totalResponses]);
      aggRows.push([q.title, q.type, "Sentiment positif", analysis.sentiment.positive]);
      aggRows.push([q.title, q.type, "Sentiment neutre", analysis.sentiment.neutral]);
      aggRows.push([q.title, q.type, "Sentiment négatif", analysis.sentiment.negative]);
      analysis.wordFrequencies.slice(0, 10).forEach((wf) => {
        aggRows.push([q.title, q.type, `Mot-clé: ${wf.word}`, wf.count]);
      });
    }
  });

  const wsAgg = XLSX.utils.aoa_to_sheet([aggHeaders, ...aggRows]);
  wsAgg["!cols"] = [{ wch: 40 }, { wch: 15 }, { wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsAgg, "Agrégations");

  // Download
  const filename = `sondage_${survey.title.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
