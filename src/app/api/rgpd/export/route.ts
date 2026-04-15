import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ExcelJS from "exceljs";

// Labels lisibles pour les types de questions
const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq_single: "QCM (choix unique)",
  mcq_multiple: "QCM (choix multiple)",
  counter: "Compteur",
  free_text: "Texte libre",
};

// Couleurs SUD P2ST
const SUD_YELLOW = "FFFFF9C4";
const SUD_PINK = "FFE60077";
const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: SUD_YELLOW },
};
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD0D0D0" } },
  bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
  left: { style: "thin", color: { argb: "FFD0D0D0" } },
  right: { style: "thin", color: { argb: "FFD0D0D0" } },
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ── Sécurité : vérifier super_admin ──
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux super administrateurs." },
        { status: 403 }
      );
    }

    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "Paramètre userId requis." },
        { status: 400 }
      );
    }

    // ── Récupération des données ──

    // Profil utilisateur
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, site_id, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (!targetProfile) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    // Site
    let siteName = "Aucun";
    if (targetProfile.site_id) {
      const { data: site } = await supabase
        .from("sites")
        .select("name")
        .eq("id", targetProfile.site_id)
        .single();
      siteName = site?.name ?? "Aucun";
    }

    // Participations
    const { data: responses } = await supabase
      .from("responses")
      .select("id, survey_id, submitted_at")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false });

    const responsesList = responses ?? [];

    // Sondages liés
    const surveyIds = [...new Set(responsesList.map((r) => r.survey_id))];
    const surveysMap: Record<string, { title: string; description: string | null }> = {};

    if (surveyIds.length > 0) {
      const { data: surveys } = await supabase
        .from("surveys")
        .select("id, title, description")
        .in("id", surveyIds);

      (surveys ?? []).forEach((s) => {
        surveysMap[s.id] = { title: s.title, description: s.description };
      });
    }

    // Réponses (answers)
    const responseIds = responsesList.map((r) => r.id);
    let allAnswers: Array<{
      response_id: string;
      question_id: string;
      value: string | string[] | number;
      created_at: string;
    }> = [];

    if (responseIds.length > 0) {
      const { data: answers } = await supabase
        .from("answers")
        .select("response_id, question_id, value, created_at")
        .in("response_id", responseIds);

      allAnswers = answers ?? [];
    }

    // Questions liées
    const questionIds = [...new Set(allAnswers.map((a) => a.question_id))];
    const questionsMap: Record<string, { title: string; type: string }> = {};

    if (questionIds.length > 0) {
      const { data: questions } = await supabase
        .from("questions")
        .select("id, title, type")
        .in("id", questionIds);

      (questions ?? []).forEach((q) => {
        questionsMap[q.id] = { title: q.title, type: q.type };
      });
    }

    // ── Structuration pour Excel ──

    // Données feuille "Informations utilisateur"
    const userInfo = {
      email: targetProfile.email,
      fullName: targetProfile.full_name ?? "—",
      site: siteName,
      role:
        targetProfile.role === "super_admin"
          ? "Super Administrateur"
          : targetProfile.role === "admin"
            ? "Administrateur"
            : "Utilisateur",
      createdAt: new Date(targetProfile.created_at).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      totalParticipations: responsesList.length,
    };

    // Données feuille "Participations"
    const participationsRows = responsesList.map((r) => {
      const survey = surveysMap[r.survey_id];
      const answersCount = allAnswers.filter((a) => a.response_id === r.id).length;
      return {
        surveyTitle: survey?.title ?? "Sondage supprimé",
        submittedAt: new Date(r.submitted_at).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        answersCount,
      };
    });

    // Données feuille "Réponses détaillées"
    const detailedRows: Array<{
      surveyTitle: string;
      question: string;
      questionType: string;
      answer: string;
      date: string;
    }> = [];

    for (const r of responsesList) {
      const survey = surveysMap[r.survey_id];
      const responseAnswers = allAnswers.filter((a) => a.response_id === r.id);

      for (const ans of responseAnswers) {
        const question = questionsMap[ans.question_id];

        // Formater la réponse de manière lisible
        let formattedAnswer: string;
        if (Array.isArray(ans.value)) {
          formattedAnswer = ans.value.join(", ");
        } else if (typeof ans.value === "number") {
          formattedAnswer = ans.value.toString();
        } else {
          formattedAnswer = String(ans.value);
        }

        detailedRows.push({
          surveyTitle: survey?.title ?? "Sondage supprimé",
          question: question?.title ?? "Question supprimée",
          questionType:
            QUESTION_TYPE_LABELS[question?.type ?? ""] ?? question?.type ?? "Inconnu",
          answer: formattedAnswer,
          date: new Date(ans.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
        });
      }
    }

    // ── Génération Excel ──

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SUD P2ST";
    workbook.created = new Date();

    const exportDate = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // ─── Feuille 1 : Résumé ───
    const wsResume = workbook.addWorksheet("Résumé");

    wsResume.mergeCells("A1:B1");
    const titleCell = wsResume.getCell("A1");
    titleCell.value = "Export des données personnelles — RGPD";
    titleCell.font = { bold: true, size: 16, color: { argb: SUD_PINK } };
    titleCell.alignment = { vertical: "middle" };

    wsResume.mergeCells("A3:B3");
    const subtitleCell = wsResume.getCell("A3");
    subtitleCell.value =
      "Export réalisé dans le cadre du droit à la portabilité des données (Article 20 du RGPD)";
    subtitleCell.font = { italic: true, size: 10, color: { argb: "FF666666" } };

    wsResume.addRow([]);

    const resumeData = [
      ["Utilisateur", userInfo.fullName],
      ["Email", userInfo.email],
      ["Site", userInfo.site],
      ["Rôle", userInfo.role],
      ["Compte créé le", userInfo.createdAt],
      ["Participations", userInfo.totalParticipations],
      ["Réponses totales", allAnswers.length],
      ["Sondages participés", surveyIds.length],
      ["", ""],
      ["Date d'export", exportDate],
      ["Exporté par", user.email ?? "—"],
    ];

    for (const [label, value] of resumeData) {
      const row = wsResume.addRow([label, value]);
      row.getCell(1).font = { bold: true, size: 11 };
      row.getCell(1).border = THIN_BORDER;
      row.getCell(2).border = THIN_BORDER;
      if (label) {
        row.getCell(1).fill = HEADER_FILL;
      }
    }

    wsResume.getColumn(1).width = 25;
    wsResume.getColumn(2).width = 45;

    // ─── Feuille 2 : Informations utilisateur ───
    const wsUser = workbook.addWorksheet("Informations utilisateur");

    const userHeaders = ["Email", "Site", "Rôle", "Date de création", "Participations"];
    const userHeaderRow = wsUser.addRow(userHeaders);
    styleHeaderRow(userHeaderRow);

    const userDataRow = wsUser.addRow([
      userInfo.email,
      userInfo.site,
      userInfo.role,
      userInfo.createdAt,
      userInfo.totalParticipations,
    ]);
    styleDataRow(userDataRow);

    autoFitColumns(wsUser, userHeaders);

    // ─── Feuille 3 : Participations ───
    const wsParticipations = workbook.addWorksheet("Participations");

    const partHeaders = ["Nom du sondage", "Date de participation", "Nombre de réponses"];
    const partHeaderRow = wsParticipations.addRow(partHeaders);
    styleHeaderRow(partHeaderRow);

    for (const p of participationsRows) {
      const row = wsParticipations.addRow([p.surveyTitle, p.submittedAt, p.answersCount]);
      styleDataRow(row);
    }

    if (participationsRows.length === 0) {
      const emptyRow = wsParticipations.addRow(["Aucune participation", "", ""]);
      emptyRow.getCell(1).font = { italic: true, color: { argb: "FF999999" } };
    }

    autoFitColumns(wsParticipations, partHeaders);

    // ─── Feuille 4 : Réponses détaillées ───
    const wsDetails = workbook.addWorksheet("Réponses détaillées");

    const detailHeaders = [
      "Nom du sondage",
      "Question",
      "Type de question",
      "Réponse",
      "Date",
    ];
    const detailHeaderRow = wsDetails.addRow(detailHeaders);
    styleHeaderRow(detailHeaderRow);

    for (const d of detailedRows) {
      const row = wsDetails.addRow([
        d.surveyTitle,
        d.question,
        d.questionType,
        d.answer,
        d.date,
      ]);
      styleDataRow(row);
    }

    if (detailedRows.length === 0) {
      const emptyRow = wsDetails.addRow(["Aucune réponse", "", "", "", ""]);
      emptyRow.getCell(1).font = { italic: true, color: { argb: "FF999999" } };
    }

    autoFitColumns(wsDetails, detailHeaders);

    // ── Génération du buffer ──
    const buffer = await workbook.xlsx.writeBuffer();

    // ── Réponse HTTP avec le fichier Excel ──
    const safeEmail = targetProfile.email.replace(/[^a-zA-Z0-9]/g, "_");
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `export_utilisateur_${safeEmail}_${dateStr}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

// ── Helpers de style ──

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: "FF333333" } };
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });
  row.height = 28;
}

function styleDataRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { size: 10 };
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: "middle", wrapText: true };
  });
}

function autoFitColumns(ws: ExcelJS.Worksheet, headers: string[]) {
  headers.forEach((header, i) => {
    const col = ws.getColumn(i + 1);
    let maxLen = header.length;

    col.eachCell({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > maxLen) maxLen = len;
    });

    col.width = Math.min(Math.max(maxLen + 4, 15), 60);
  });
}
