"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import type { Survey, Question } from "@/types";

type AnswerValue = string | string[] | number;

export default function SurveyResponsePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: surveyData } = await supabase
        .from("surveys")
        .select("*")
        .eq("id", id)
        .single();

      if (!surveyData) {
        setLoading(false);
        return;
      }
      setSurvey(surveyData as Survey);

      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .eq("survey_id", id)
        .order("position");

      const qs = (questionsData as Question[]) ?? [];
      setQuestions(qs);

      const defaults: Record<string, AnswerValue> = {};
      qs.forEach((q) => {
        if (q.type === "mcq_single") defaults[q.id] = "";
        else if (q.type === "mcq_multiple") defaults[q.id] = [];
        else if (q.type === "counter") defaults[q.id] = 0;
        else defaults[q.id] = "";
      });
      setAnswers(defaults);

      if (user) {
        const { data: existing } = await supabase
          .from("responses")
          .select("id")
          .eq("survey_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) setAlreadyAnswered(true);
      }

      setLoading(false);
    }
    load();
  }, [id, user]);

  function updateAnswer(questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleCheckbox(questionId: string, option: string, checked: boolean) {
    const current = (answers[questionId] as string[]) || [];
    const updated = checked
      ? [...current, option]
      : current.filter((o) => o !== option);
    updateAnswer(questionId, updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSubmitting(true);

    for (const q of questions) {
      const val = answers[q.id];
      if (q.type === "mcq_single" && !val) {
        setError(`Veuillez répondre à : "${q.title}"`);
        setSubmitting(false);
        return;
      }
      if (q.type === "mcq_multiple" && (val as string[]).length === 0) {
        setError(`Veuillez sélectionner au moins une option pour : "${q.title}"`);
        setSubmitting(false);
        return;
      }
      if (q.type === "free_text" && !(val as string).trim()) {
        setError(`Veuillez répondre à : "${q.title}"`);
        setSubmitting(false);
        return;
      }
    }

    const { data: response, error: responseError } = await supabase
      .from("responses")
      .insert({ survey_id: id, user_id: user.id })
      .select("id")
      .single();

    if (responseError || !response) {
      setError(responseError?.message ?? "Erreur lors de la soumission.");
      setSubmitting(false);
      return;
    }

    const answersToInsert = questions.map((q) => ({
      response_id: response.id,
      question_id: q.id,
      value: answers[q.id],
    }));

    const { error: answersError } = await supabase
      .from("answers")
      .insert(answersToInsert);

    if (answersError) {
      setError(answersError.message);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  }

  if (loading) {
    return <p className="text-gray-500">Chargement du sondage...</p>;
  }

  if (!survey) {
    return <p style={{ color: "#E60077" }}>Sondage introuvable.</p>;
  }

  if (alreadyAnswered) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div
          className="p-8 rounded-xl border"
          style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <h1 className="text-2xl font-bold text-white mb-4">{survey.title}</h1>
          <p className="font-medium" style={{ color: "var(--sud-yellow)" }}>
            Vous avez déjà répondu à ce sondage.
          </p>
          <button
            onClick={() => router.push("/surveys")}
            className="mt-4 hover:underline"
            style={{ color: "#E60077" }}
          >
            Retour aux sondages
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div
          className="p-8 rounded-xl border"
          style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--sud-yellow)" }}>
            Merci !
          </h1>
          <p className="text-gray-400">Vos réponses ont été enregistrées avec succès.</p>
          <button
            onClick={() => router.push("/surveys")}
            className="mt-4 hover:underline"
            style={{ color: "#E60077" }}
          >
            Retour aux sondages
          </button>
        </div>
      </div>
    );
  }

  const inputStyle = {
    background: "var(--sud-black)",
    borderColor: "var(--sud-border)",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="p-6 rounded-xl mb-6 border"
        style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
      >
        <h1 className="text-2xl font-bold text-white mb-2">{survey.title}</h1>
        {survey.description && (
          <p className="text-gray-500">{survey.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className="p-5 rounded-xl border"
            style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
          >
            <h3 className="font-medium text-white mb-3">
              {index + 1}. {q.title}
            </h3>

            {q.type === "mcq_single" && q.options && (
              <div className="space-y-2">
                {q.options.map((option) => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition">
                    <input
                      type="radio"
                      name={q.id}
                      value={option}
                      checked={answers[q.id] === option}
                      onChange={() => updateAnswer(q.id, option)}
                      className="w-4 h-4 accent-pink-600"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "mcq_multiple" && q.options && (
              <div className="space-y-2">
                {q.options.map((option) => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={(answers[q.id] as string[] || []).includes(option)}
                      onChange={(e) => handleCheckbox(q.id, option, e.target.checked)}
                      className="w-4 h-4 rounded accent-pink-600"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "counter" && (
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={answers[q.id] as number}
                  onChange={(e) => updateAnswer(q.id, Number(e.target.value))}
                  className="flex-1 accent-pink-600"
                />
                <span
                  className="text-lg font-bold min-w-[2rem] text-center"
                  style={{ color: "#E60077" }}
                >
                  {answers[q.id] as number}
                </span>
              </div>
            )}

            {q.type === "free_text" && (
              <textarea
                value={answers[q.id] as string}
                onChange={(e) => updateAnswer(q.id, e.target.value)}
                rows={3}
                placeholder="Votre réponse..."
                className="w-full px-3 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 border"
                style={inputStyle}
              />
            )}
          </div>
        ))}

        {error && (
          <p className="text-sm p-3 rounded-lg" style={{ background: "rgba(230,0,119,0.1)", color: "#E60077" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
          style={{ background: "#E60077" }}
        >
          {submitting ? "Envoi en cours..." : "Soumettre mes réponses"}
        </button>
      </form>
    </div>
  );
}
