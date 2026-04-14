import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { Survey, Question, Answer } from "@/types";
import { analyzeMcq, analyzeCounter, analyzeText } from "./analytics";

interface ExportData {
  survey: Survey;
  questions: Question[];
  answers: Answer[];
  totalResponses: number;
  siteName?: string;
}

// Couleurs SUD P2ST
const PINK = "FFE60077";
const YELLOW_LIGHT = "FFFFF9C4";
const GRAY_HEADER = "FFF5F5F5";
const GRAY_BORDER = "FFE0E0E0";
const WHITE = "FFFFFFFF";

function applyHeaderStyle(row: ExcelJS.Row, colCount: number) {
  row.font = { bold: true, color: { argb: "FF222222" }, size: 11 };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY_HEADER } };
  row.alignment = { vertical: "middle", horizontal: "center" };
  row.height = 28;
  for (let i = 1; i <= colCount; i++) {
    row.getCell(i).border = {
      top: { style: "thin", color: { argb: GRAY_BORDER } },
      bottom: { style: "thin", color: { argb: GRAY_BORDER } },
      left: { style: "thin", color: { argb: GRAY_BORDER } },
      right: { style: "thin", color: { argb: GRAY_BORDER } },
    };
  }
}

function applyDataBorder(row: ExcelJS.Row, colCount: number) {
  for (let i = 1; i <= colCount; i++) {
    row.getCell(i).border = {
      top: { style: "thin", color: { argb: GRAY_BORDER } },
      bottom: { style: "thin", color: { argb: GRAY_BORDER } },
      left: { style: "thin", color: { argb: GRAY_BORDER } },
      right: { style: "thin", color: { argb: GRAY_BORDER } },
    };
  }
}

function applyTotalRowStyle(row: ExcelJS.Row, colCount: number) {
  row.font = { bold: true, color: { argb: PINK }, size: 11 };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: YELLOW_LIGHT } };
  applyDataBorder(row, colCount);
}

function autoWidth(ws: ExcelJS.Worksheet) {
  ws.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 4, 60);
  });
}

function truncateSheetName(name: string, maxLen = 31): string {
  // Excel sheet names max 31 chars, no special chars
  const clean = name.replace(/[\\/*?[\]:]/g, "");
  return clean.length > maxLen ? clean.slice(0, maxLen) : clean;
}

export async function exportToExcel({ survey, questions, answers, totalResponses, siteName }: ExportData) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SUD P2ST — Sondages";
  wb.created = new Date();

  // ═══════════════════════════════════════════
  // FEUILLE 1 : Résumé global
  // ═══════════════════════════════════════════
  const wsSummary = wb.addWorksheet("Résumé global");

  // Titre
  const titleRow = wsSummary.addRow(["Résultats du sondage"]);
  titleRow.font = { bold: true, size: 16, color: { argb: PINK } };
  titleRow.height = 30;
  wsSummary.mergeCells("A1:B1");

  wsSummary.addRow([]); // empty row

  // Infos
  const infoData = [
    ["Nom du sondage", survey.title],
    ["Description", survey.description || "—"],
    ["Date de création", new Date(survey.created_at).toLocaleDateString("fr-FR")],
    ["Date d'export", new Date().toLocaleDateString("fr-FR")],
    ["Nombre total de participants", totalResponses],
    ["Nombre de questions", questions.length],
    ["Site(s)", siteName || "Tous les sites"],
    ["Statut", survey.is_active ? "Actif" : "Inactif"],
  ];

  infoData.forEach(([label, value]) => {
    const row = wsSummary.addRow([label, value]);
    row.getCell(1).font = { bold: true, color: { argb: "FF222222" }, size: 11 };
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: YELLOW_LIGHT } };
    row.getCell(2).font = { size: 11, color: { argb: "FF333333" } };
    applyDataBorder(row, 2);
    row.height = 22;
  });

  wsSummary.addRow([]);

  // Récapitulatif des questions
  const qSummaryHeader = wsSummary.addRow(["#", "Question", "Type", "Réponses"]);
  applyHeaderStyle(qSummaryHeader, 4);

  const typeLabels: Record<string, string> = {
    mcq_single: "QCM — Choix unique",
    mcq_multiple: "QCM — Choix multiple",
    counter: "Note / Compteur",
    free_text: "Texte libre",
  };

  questions.forEach((q, i) => {
    const qAnswers = answers.filter((a) => a.question_id === q.id);
    const row = wsSummary.addRow([i + 1, q.title, typeLabels[q.type] ?? q.type, qAnswers.length]);
    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(4).alignment = { horizontal: "center" };
    applyDataBorder(row, 4);
  });

  autoWidth(wsSummary);
  // Force minimum widths
  wsSummary.getColumn(1).width = Math.max(wsSummary.getColumn(1).width ?? 0, 25);
  wsSummary.getColumn(2).width = Math.max(wsSummary.getColumn(2).width ?? 0, 40);

  // ═══════════════════════════════════════════
  // FEUILLES PAR QUESTION
  // ═══════════════════════════════════════════
  questions.forEach((q, index) => {
    const qAnswers = answers.filter((a) => a.question_id === q.id);
    const sheetName = truncateSheetName(`Q${index + 1} - ${q.title}`);
    const ws = wb.addWorksheet(sheetName);

    // Titre de la question
    const qTitle = ws.addRow([`Q${index + 1}. ${q.title}`]);
    qTitle.font = { bold: true, size: 14, color: { argb: PINK } };
    qTitle.height = 28;

    const qType = ws.addRow([typeLabels[q.type] ?? q.type]);
    qType.font = { italic: true, size: 10, color: { argb: "FF666666" } };

    ws.addRow([]); // spacer

    // ── QCM ──
    if ((q.type === "mcq_single" || q.type === "mcq_multiple") && q.options) {
      const analysis = analyzeMcq(qAnswers, q.options);

      // Trier par votes décroissants
      const sorted = [...analysis.options].sort((a, b) => b.count - a.count);

      const header = ws.addRow(["Option", "Votes", "%"]);
      applyHeaderStyle(header, 3);

      sorted.forEach((opt) => {
        const row = ws.addRow([opt.name, opt.count, `${opt.percentage.toFixed(1)}%`]);
        row.getCell(2).alignment = { horizontal: "center" };
        row.getCell(3).alignment = { horizontal: "center" };
        applyDataBorder(row, 3);
      });

      // Ligne TOTAL
      const totalRow = ws.addRow(["TOTAL", analysis.total, "100.0%"]);
      totalRow.getCell(2).alignment = { horizontal: "center" };
      totalRow.getCell(3).alignment = { horizontal: "center" };
      applyTotalRowStyle(totalRow, 3);

      ws.addRow([]);
      const topRow = ws.addRow(["Option favorite", analysis.topOption]);
      topRow.getCell(1).font = { bold: true, size: 11 };
      topRow.getCell(2).font = { bold: true, color: { argb: PINK }, size: 11 };

      autoWidth(ws);
      ws.getColumn(1).width = Math.max(ws.getColumn(1).width ?? 0, 30);
    }

    // ── Compteur ──
    if (q.type === "counter") {
      const analysis = analyzeCounter(qAnswers);

      const header = ws.addRow(["Métrique", "Valeur"]);
      applyHeaderStyle(header, 2);

      const metrics = [
        ["Moyenne", Number(analysis.average.toFixed(2))],
        ["Médiane", analysis.median],
        ["Minimum", analysis.min],
        ["Maximum", analysis.max],
        ["Écart-type", Number(analysis.stdDev.toFixed(2))],
        ["Nombre de réponses", analysis.total],
      ] as [string, number][];

      metrics.forEach(([label, value]) => {
        const row = ws.addRow([label, value]);
        row.getCell(1).font = { bold: true };
        row.getCell(2).alignment = { horizontal: "center" };
        applyDataBorder(row, 2);
      });

      // Distribution
      if (analysis.distribution.some((d) => d.count > 0)) {
        ws.addRow([]);
        const distTitle = ws.addRow(["Distribution des réponses"]);
        distTitle.font = { bold: true, size: 12, color: { argb: PINK } };

        const distHeader = ws.addRow(["Valeur", "Nombre"]);
        applyHeaderStyle(distHeader, 2);

        analysis.distribution
          .filter((d) => d.count > 0)
          .forEach((d) => {
            const row = ws.addRow([d.name, d.count]);
            row.getCell(2).alignment = { horizontal: "center" };
            applyDataBorder(row, 2);
          });
      }

      autoWidth(ws);
      ws.getColumn(1).width = Math.max(ws.getColumn(1).width ?? 0, 25);
    }

    // ── Texte libre ──
    if (q.type === "free_text") {
      const analysis = analyzeText(qAnswers);

      // Section 1 : Réponses brutes
      const respTitle = ws.addRow(["Réponses"]);
      respTitle.font = { bold: true, size: 12, color: { argb: PINK } };

      const respHeader = ws.addRow(["#", "Réponse"]);
      applyHeaderStyle(respHeader, 2);

      qAnswers.forEach((a, i) => {
        const row = ws.addRow([i + 1, String(a.value)]);
        row.getCell(1).alignment = { horizontal: "center" };
        row.getCell(2).alignment = { wrapText: true };
        applyDataBorder(row, 2);
      });

      ws.addRow([]);

      // Section 2 : Mots-clés
      if (analysis.wordFrequencies.length > 0) {
        const kwTitle = ws.addRow(["Analyse des mots-clés"]);
        kwTitle.font = { bold: true, size: 12, color: { argb: PINK } };

        const kwHeader = ws.addRow(["Mot", "Occurrences"]);
        applyHeaderStyle(kwHeader, 2);

        analysis.wordFrequencies.forEach((wf) => {
          const row = ws.addRow([wf.word, wf.count]);
          row.getCell(2).alignment = { horizontal: "center" };
          applyDataBorder(row, 2);
        });
      }

      ws.addRow([]);

      // Section 3 : Sentiment
      const sentTitle = ws.addRow(["Analyse de sentiment"]);
      sentTitle.font = { bold: true, size: 12, color: { argb: PINK } };

      const sentHeader = ws.addRow(["Sentiment", "Nombre", "%"]);
      applyHeaderStyle(sentHeader, 3);

      const sentTotal = analysis.sentiment.positive + analysis.sentiment.neutral + analysis.sentiment.negative;
      const sentData = [
        ["Positif", analysis.sentiment.positive],
        ["Neutre", analysis.sentiment.neutral],
        ["Négatif", analysis.sentiment.negative],
      ] as [string, number][];

      sentData.forEach(([label, count]) => {
        const pct = sentTotal > 0 ? ((count / sentTotal) * 100).toFixed(1) : "0.0";
        const row = ws.addRow([label, count, `${pct}%`]);
        row.getCell(2).alignment = { horizontal: "center" };
        row.getCell(3).alignment = { horizontal: "center" };
        applyDataBorder(row, 3);
      });

      autoWidth(ws);
      ws.getColumn(1).width = Math.max(ws.getColumn(1).width ?? 0, 15);
      ws.getColumn(2).width = Math.max(ws.getColumn(2).width ?? 0, 50);
    }
  });

  // ═══════════════════════════════════════════
  // Génération et téléchargement
  // ═══════════════════════════════════════════
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const filename = `resultats_sondage_${survey.title.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿç]/gi, "_")}.xlsx`;
  saveAs(blob, filename);
}
