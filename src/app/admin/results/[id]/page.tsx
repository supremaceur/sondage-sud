"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import type { Survey, Question, Answer, Site } from "@/types";
import { analyzeMcq, analyzeCounter, analyzeText } from "@/lib/analytics";
import { exportToExcel } from "@/lib/export";
import McqChart from "@/components/charts/McqChart";
import CounterChart from "@/components/charts/CounterChart";
import WordCloud from "@/components/charts/WordCloud";
import SentimentBar from "@/components/charts/SentimentBar";

interface SurveyWithSite extends Survey {
  sites: { name: string } | null;
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { role, profile: userProfile, site: userSite } = useAuth();
  const supabase = createClient();
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin";

  const [survey, setSurvey] = useState<SurveyWithSite | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const { data: surveyData } = await supabase
        .from("surveys")
        .select("*, sites(name)")
        .eq("id", id)
        .single();

      const s = surveyData as SurveyWithSite | null;

      // Vérifier l'accès : un admin ne peut voir que les sondages de son site
      if (s && isAdmin && userProfile?.site_id && s.site_id && s.site_id !== userProfile.site_id) {
        window.location.href = "/admin";
        return;
      }

      setSurvey(s);

      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .eq("survey_id", id)
        .order("position");

      setQuestions((questionsData as Question[]) ?? []);

      // Pour un admin (non super_admin), filtrer les réponses par son site
      const adminSiteId = isAdmin && userProfile?.site_id ? userProfile.site_id : null;

      // Récupérer les réponses avec le user_id pour pouvoir filtrer par site
      let responsesQuery = supabase
        .from("responses")
        .select("id, user_id")
        .eq("survey_id", id);

      const { data: responsesData } = await responsesQuery;
      let filteredResponses = responsesData ?? [];

      // Si admin (non super_admin), filtrer par les users de son site
      if (adminSiteId && filteredResponses.length > 0) {
        const userIds = filteredResponses.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, site_id")
          .in("id", userIds)
          .eq("site_id", adminSiteId);

        const siteUserIds = new Set((profiles ?? []).map((p) => p.id));
        filteredResponses = filteredResponses.filter((r) => siteUserIds.has(r.user_id));
      }

      setTotalResponses(filteredResponses.length);

      const responseIds = filteredResponses.map((r) => r.id);

      if (responseIds.length > 0) {
        const { data: answersData } = await supabase
          .from("answers")
          .select("*")
          .in("response_id", responseIds);

        setAnswers((answersData as Answer[]) ?? []);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  function getAnswersForQuestion(questionId: string): Answer[] {
    return answers.filter((a) => a.question_id === questionId);
  }

  function toggleCollapse(qId: string) {
    setCollapsed((prev) => ({ ...prev, [qId]: !prev[qId] }));
  }

  // Nom du site : pour un admin, c'est son propre site ; pour super_admin, c'est celui du sondage ou "Tous"
  const siteName = isAdmin && userSite ? userSite.name : (survey?.sites?.name ?? "Tous les sites");

  async function handleExport() {
    if (!survey) return;
    await exportToExcel({
      survey,
      questions,
      answers,
      totalResponses,
      siteName,
    });
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-20 rounded-xl animate-pulse" style={{ background: "#F0F0F0" }} />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "#F0F0F0" }} />
          ))}
        </div>
        <div className="h-64 rounded-xl animate-pulse" style={{ background: "#F0F0F0" }} />
      </div>
    );
  }

  if (!survey) return <p style={{ color: "#E60077" }}>Sondage introuvable.</p>;

  // Question type labels
  const typeLabels: Record<string, string> = {
    mcq_single: "QCM — Choix unique",
    mcq_multiple: "QCM — Choix multiple",
    counter: "Note / Compteur",
    free_text: "Texte libre",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin" className="text-sm hover:underline mb-2 inline-block" style={{ color: "#E60077" }}>
          &larr; Retour au tableau de bord
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--sud-black)" }}>{survey.title}</h1>
            {survey.description && (
              <p className="text-sm mt-1" style={{ color: "var(--sud-muted)" }}>{survey.description}</p>
            )}
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
            style={{ background: "#E60077" }}
          >
            Exporter Excel
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border shadow-sm" style={{ background: "var(--sud-pink-light)", borderColor: "var(--sud-border)" }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#E60077" }}>Réponses</p>
          <p className="text-3xl font-bold" style={{ color: "#E60077" }}>{totalResponses}</p>
        </div>
        <div className="p-4 rounded-xl border shadow-sm" style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sud-muted)" }}>Questions</p>
          <p className="text-3xl font-bold" style={{ color: "var(--sud-black)" }}>{questions.length}</p>
        </div>
        <div className="p-4 rounded-xl border shadow-sm" style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sud-muted)" }}>Site</p>
          <p className="text-lg font-bold mt-1" style={{ color: "var(--sud-black)" }}>{siteName}</p>
        </div>
        <div className="p-4 rounded-xl border shadow-sm" style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sud-muted)" }}>Statut</p>
          <p className="text-lg font-bold mt-1" style={{ color: survey.is_active ? "#4CAF50" : "#999" }}>
            {survey.is_active ? "Actif" : "Terminé"}
          </p>
        </div>
      </div>

      {/* No responses */}
      {totalResponses === 0 ? (
        <div
          className="p-8 rounded-xl text-center border shadow-sm"
          style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <p style={{ color: "var(--sud-muted)" }}>Aucune réponse pour le moment.</p>
        </div>
      ) : (
        /* Questions analysis */
        <div className="space-y-6">
          {questions.map((q, index) => {
            const qAnswers = getAnswersForQuestion(q.id);
            const isCollapsed = collapsed[q.id];

            return (
              <div
                key={q.id}
                className="rounded-xl border shadow-sm overflow-hidden"
                style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
              >
                {/* Question header (collapsible) */}
                <button
                  onClick={() => toggleCollapse(q.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: "#E60077" }}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold" style={{ color: "var(--sud-black)" }}>{q.title}</h3>
                      <span className="text-xs" style={{ color: "var(--sud-muted)" }}>
                        {typeLabels[q.type] ?? q.type} — {qAnswers.length} réponse{qAnswers.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <span className="text-lg" style={{ color: "var(--sud-muted)", transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}>
                    ▼
                  </span>
                </button>

                {/* Question content */}
                {!isCollapsed && (
                  <div className="px-6 pb-6" style={{ borderTop: "1px solid var(--sud-border)" }}>
                    <div className="pt-4">
                      {/* QCM */}
                      {(q.type === "mcq_single" || q.type === "mcq_multiple") && q.options && (
                        <McqChart data={analyzeMcq(qAnswers, q.options)} />
                      )}

                      {/* Counter */}
                      {q.type === "counter" && (
                        <CounterChart data={analyzeCounter(qAnswers)} />
                      )}

                      {/* Free text */}
                      {q.type === "free_text" && (
                        <FreeTextSection answers={qAnswers} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Free Text Sub-component ---
function FreeTextSection({ answers }: { answers: Answer[] }) {
  const analysis = analyzeText(answers);
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="space-y-5">
      {/* Sentiment */}
      <div>
        <h4 className="text-sm font-medium mb-2" style={{ color: "var(--sud-muted)" }}>Analyse de sentiment</h4>
        <SentimentBar {...analysis.sentiment} />
      </div>

      {/* Word cloud */}
      {analysis.wordFrequencies.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2" style={{ color: "var(--sud-muted)" }}>Mots-clés fréquents</h4>
          <div className="rounded-lg p-4" style={{ background: "#FAFAFA" }}>
            <WordCloud words={analysis.wordFrequencies} />
          </div>
        </div>
      )}

      {/* Top keywords table */}
      {analysis.wordFrequencies.length > 0 && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--sud-border)" }}>
          <table className="w-full text-sm">
            <thead style={{ background: "#FAFAFA" }}>
              <tr>
                <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--sud-muted)" }}>Mot-clé</th>
                <th className="text-right px-3 py-2 font-medium" style={{ color: "var(--sud-muted)" }}>Occurrences</th>
              </tr>
            </thead>
            <tbody>
              {analysis.wordFrequencies.slice(0, 10).map((wf) => (
                <tr key={wf.word} style={{ borderTop: "1px solid var(--sud-border)" }}>
                  <td className="px-3 py-2 font-medium" style={{ color: "var(--sud-black)" }}>{wf.word}</td>
                  <td className="px-3 py-2 text-right" style={{ color: "#E60077" }}>{wf.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sample responses */}
      <div>
        <h4 className="text-sm font-medium mb-2" style={{ color: "var(--sud-muted)" }}>
          Réponses ({analysis.totalResponses})
        </h4>
        <div className="space-y-2">
          {(showAll ? answers : answers.slice(0, 5)).map((a, i) => (
            <div
              key={a.id}
              className="px-4 py-3 rounded-lg text-sm"
              style={{ background: "#FAFAFA", color: "var(--sud-dark)" }}
            >
              <span style={{ color: "var(--sud-muted)" }} className="mr-2 text-xs">#{i + 1}</span>
              {String(a.value)}
            </div>
          ))}
        </div>
        {answers.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-2 text-sm font-medium hover:underline"
            style={{ color: "#E60077" }}
          >
            {showAll ? "Voir moins" : `Voir les ${answers.length} réponses`}
          </button>
        )}
      </div>
    </div>
  );
}
