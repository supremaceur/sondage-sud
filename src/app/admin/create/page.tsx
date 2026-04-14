"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import SiteSelect from "@/components/SiteSelect";
import QuestionForm, { type QuestionDraft } from "@/components/QuestionForm";

export default function CreateSurveyPage() {
  const { user, profile, role } = useAuth();
  const isSuperAdmin = role === "super_admin";
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { type: "mcq_single", title: "", options: ["", ""] },
  ]);
  const [siteId, setSiteId] = useState(profile?.site_id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addQuestion() {
    setQuestions([...questions, { type: "mcq_single", title: "", options: ["", ""] }]);
  }

  function updateQuestion(index: number, question: QuestionDraft) {
    const updated = [...questions];
    updated[index] = question;
    setQuestions(updated);
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setLoading(true);

    for (const q of questions) {
      if (!q.title.trim()) {
        setError("Toutes les questions doivent avoir un intitulé.");
        setLoading(false);
        return;
      }
      if ((q.type === "mcq_single" || q.type === "mcq_multiple") &&
          q.options.some((o) => !o.trim())) {
        setError("Toutes les options QCM doivent être remplies.");
        setLoading(false);
        return;
      }
    }

    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        title,
        description: description || null,
        created_by: user.id,
        site_id: isSuperAdmin ? siteId : profile?.site_id,
      })
      .select("id")
      .single();

    if (surveyError || !survey) {
      setError(surveyError?.message ?? "Erreur lors de la création du sondage.");
      setLoading(false);
      return;
    }

    const questionsToInsert = questions.map((q, i) => ({
      survey_id: survey.id,
      type: q.type,
      title: q.title,
      options: (q.type === "mcq_single" || q.type === "mcq_multiple") ? q.options : null,
      position: i,
    }));

    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionsToInsert);

    if (questionsError) {
      setError(questionsError.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  const inputStyle = {
    background: "var(--sud-black)",
    borderColor: "var(--sud-border)",
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">
        Créer un sondage
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className="p-6 rounded-xl border"
          style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <div className="space-y-4">
            {isSuperAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Site cible
                </label>
                <SiteSelect value={siteId} onChange={setSiteId} />
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-1">
                Titre du sondage
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ex: Enquête satisfaction 2026"
                className="w-full px-3 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 border"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">
                Description (optionnelle)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Décrivez l'objectif du sondage..."
                className="w-full px-3 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 border"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-300">Questions</h2>

          {questions.map((question, index) => (
            <QuestionForm
              key={index}
              index={index}
              question={question}
              onChange={updateQuestion}
              onRemove={removeQuestion}
            />
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-3 border-2 border-dashed rounded-xl text-gray-500 transition"
            style={{ borderColor: "var(--sud-border)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#E60077";
              e.currentTarget.style.color = "#E60077";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--sud-border)";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            + Ajouter une question
          </button>
        </div>

        {error && (
          <p className="text-sm p-3 rounded-lg" style={{ background: "rgba(230,0,119,0.1)", color: "#E60077" }}>
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
            style={{ background: "#E60077" }}
          >
            {loading ? "Création en cours..." : "Créer le sondage"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border rounded-lg text-gray-400 transition"
            style={{ borderColor: "var(--sud-border)" }}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
