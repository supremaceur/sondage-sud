"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Survey, Question, Answer } from "@/types";
import McqChart from "@/components/charts/McqChart";
import CounterChart from "@/components/charts/CounterChart";

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Charger le sondage
      const { data: surveyData } = await supabase
        .from("surveys")
        .select("*")
        .eq("id", id)
        .single();

      setSurvey(surveyData as Survey | null);

      // Charger les questions
      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .eq("survey_id", id)
        .order("position");

      setQuestions((questionsData as Question[]) ?? []);

      // Nombre total de réponses
      const { count } = await supabase
        .from("responses")
        .select("*", { count: "exact", head: true })
        .eq("survey_id", id);

      setTotalResponses(count ?? 0);

      // Charger toutes les réponses individuelles
      const { data: responsesData } = await supabase
        .from("responses")
        .select("id")
        .eq("survey_id", id);

      const responseIds = (responsesData ?? []).map((r) => r.id);

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

  // Agrège les réponses QCM (single ou multiple)
  function aggregateMcq(questionAnswers: Answer[], options: string[]): { name: string; count: number }[] {
    const counts: Record<string, number> = {};
    options.forEach((opt) => (counts[opt] = 0));

    questionAnswers.forEach((a) => {
      const val = a.value;
      if (Array.isArray(val)) {
        val.forEach((v) => { if (counts[v] !== undefined) counts[v]++; });
      } else if (typeof val === "string" && counts[val] !== undefined) {
        counts[val]++;
      }
    });

    return options.map((opt) => ({ name: opt, count: counts[opt] }));
  }

  // Agrège les réponses compteur
  function aggregateCounter(questionAnswers: Answer[]): { average: number; distribution: { name: string; count: number }[] } {
    const values = questionAnswers.map((a) => Number(a.value)).filter((v) => !isNaN(v));
    const average = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;

    const dist: Record<number, number> = {};
    for (let i = 0; i <= 10; i++) dist[i] = 0;
    values.forEach((v) => { if (dist[v] !== undefined) dist[v]++; });

    const distribution = Object.entries(dist).map(([k, v]) => ({ name: k, count: v }));
    return { average, distribution };
  }

  if (loading) return <p className="text-gray-500">Chargement des résultats...</p>;
  if (!survey) return <p style={{ color: "#E60077" }}>Sondage introuvable.</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm hover:underline mb-2 inline-block" style={{ color: "var(--sud-yellow)" }}>
            &larr; Retour au dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">{survey.title}</h1>
          <p className="text-gray-500 mt-1">
            <span style={{ color: "#E60077", fontWeight: 600 }}>{totalResponses}</span> réponse{totalResponses > 1 ? "s" : ""} collectée{totalResponses > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {totalResponses === 0 ? (
        <div
          className="p-8 rounded-xl text-center border"
          style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <p className="text-gray-500">Aucune réponse pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, index) => {
            const qAnswers = getAnswersForQuestion(q.id);

            return (
              <div
                key={q.id}
                className="p-6 rounded-xl border"
                style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
              >
                <h3 className="font-semibold text-white mb-4">
                  {index + 1}. {q.title}
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    ({qAnswers.length} réponse{qAnswers.length > 1 ? "s" : ""})
                  </span>
                </h3>

                {(q.type === "mcq_single" || q.type === "mcq_multiple") && q.options && (
                  <McqChart data={aggregateMcq(qAnswers, q.options)} />
                )}

                {q.type === "counter" && (
                  <CounterChart {...aggregateCounter(qAnswers)} />
                )}

                {q.type === "free_text" && (
                  <div className="max-h-64 overflow-y-auto rounded-lg" style={{ background: "var(--sud-black)" }}>
                    <table className="w-full text-sm">
                      <thead className="sticky top-0" style={{ background: "var(--sud-dark)", borderBottom: "1px solid var(--sud-border)" }}>
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-500 font-medium">#</th>
                          <th className="text-left px-3 py-2 text-gray-500 font-medium">Réponse</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qAnswers.map((a, i) => (
                          <tr key={a.id} style={{ borderBottom: "1px solid var(--sud-border)" }}>
                            <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                            <td className="px-3 py-2 text-gray-300">{String(a.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
