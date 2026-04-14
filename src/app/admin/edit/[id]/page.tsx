"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import MultiSiteSelect from "@/components/MultiSiteSelect";
import QuestionForm, { type QuestionDraft } from "@/components/QuestionForm";
import type { Survey, Question } from "@/types";

export default function EditSurveyPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, role } = useAuth();
  const isSuperAdmin = role === "super_admin";
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [existingQuestionIds, setExistingQuestionIds] = useState<string[]>([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [allSites, setAllSites] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Charger le sondage
      const { data: survey } = await supabase
        .from("surveys")
        .select("*")
        .eq("id", id)
        .single();

      if (!survey) {
        setLoading(false);
        return;
      }

      setTitle(survey.title);
      setDescription(survey.description || "");
      setIsActive(survey.is_active);

      // Charger les questions
      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .eq("survey_id", id)
        .order("position");

      const qs = (questionsData as Question[]) ?? [];
      setExistingQuestionIds(qs.map((q) => q.id));
      setQuestions(
        qs.map((q) => ({
          type: q.type,
          title: q.title,
          options: q.options ?? ["", ""],
        }))
      );

      // Charger les sites associés
      const { data: surveySites } = await supabase
        .from("survey_sites")
        .select("site_id")
        .eq("survey_id", id);

      if (surveySites && surveySites.length > 0) {
        setSelectedSiteIds(surveySites.map((s) => s.site_id));
        setAllSites(false);
      } else {
        setAllSites(true);
      }

      setLoading(false);
    }
    load();
  }, [id]);

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
    setExistingQuestionIds(existingQuestionIds.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSaving(true);

    for (const q of questions) {
      if (!q.title.trim()) {
        setError("Toutes les questions doivent avoir un intitulé.");
        setSaving(false);
        return;
      }
      if ((q.type === "mcq_single" || q.type === "mcq_multiple") &&
          q.options.some((o) => !o.trim())) {
        setError("Toutes les options QCM doivent être remplies.");
        setSaving(false);
        return;
      }
    }

    // Mettre à jour le sondage
    const siteId = isSuperAdmin
      ? (allSites ? null : (selectedSiteIds.length === 1 ? selectedSiteIds[0] : null))
      : profile?.site_id;

    const { error: surveyError } = await supabase
      .from("surveys")
      .update({
        title,
        description: description || null,
        is_active: isActive,
        site_id: siteId,
      })
      .eq("id", id);

    if (surveyError) {
      setError(surveyError.message);
      setSaving(false);
      return;
    }

    // Mettre à jour les sites
    await supabase.from("survey_sites").delete().eq("survey_id", id);
    if (!allSites && selectedSiteIds.length > 0) {
      await supabase.from("survey_sites").insert(
        selectedSiteIds.map((sid) => ({ survey_id: id, site_id: sid }))
      );
    }

    // Supprimer les anciennes questions et recréer
    await supabase.from("questions").delete().eq("survey_id", id);

    const questionsToInsert = questions.map((q, i) => ({
      survey_id: id,
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
      setSaving(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  const inputStyle = {
    background: "#FAFAFA",
    borderColor: "var(--sud-border)",
    color: "var(--sud-black)",
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-10 w-48 rounded animate-pulse" style={{ background: "#F0F0F0" }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ background: "#F0F0F0" }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--sud-black)" }}>
        Modifier le sondage
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className="p-6 rounded-xl border shadow-sm"
          style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>
                Titre du sondage
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 border"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>
                Description (optionnelle)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 border"
                style={inputStyle}
              />
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>
                Statut
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsActive(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition"
                  style={{
                    background: isActive ? "var(--sud-pink-light)" : "#FAFAFA",
                    borderColor: isActive ? "#E60077" : "var(--sud-border)",
                    color: isActive ? "#E60077" : "var(--sud-muted)",
                  }}
                >
                  Actif
                </button>
                <button
                  type="button"
                  onClick={() => setIsActive(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition"
                  style={{
                    background: !isActive ? "#F5F5F5" : "#FAFAFA",
                    borderColor: !isActive ? "var(--sud-dark)" : "var(--sud-border)",
                    color: !isActive ? "var(--sud-dark)" : "var(--sud-muted)",
                  }}
                >
                  Inactif
                </button>
              </div>
            </div>

            {/* Sites */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--sud-muted)" }}>
                Sites cibles
              </label>
              {isSuperAdmin ? (
                <div className="rounded-lg border p-3" style={{ borderColor: "var(--sud-border)", background: "#FAFAFA" }}>
                  <MultiSiteSelect
                    selectedSiteIds={selectedSiteIds}
                    onChange={setSelectedSiteIds}
                    allSites={allSites}
                    onAllSitesChange={setAllSites}
                  />
                </div>
              ) : (
                <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "#FAFAFA", color: "var(--sud-dark)" }}>
                  Votre site uniquement
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: "var(--sud-dark)" }}>Questions</h2>

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
            className="w-full py-3 border-2 border-dashed rounded-xl transition"
            style={{ borderColor: "var(--sud-border)", color: "var(--sud-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#E60077";
              e.currentTarget.style.color = "#E60077";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--sud-border)";
              e.currentTarget.style.color = "var(--sud-muted)";
            }}
          >
            + Ajouter une question
          </button>
        </div>

        {error && (
          <p className="text-sm p-3 rounded-lg" style={{ background: "var(--sud-pink-light)", color: "#E60077" }}>
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
            style={{ background: "#E60077" }}
          >
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border rounded-lg transition"
            style={{ borderColor: "var(--sud-border)", color: "var(--sud-muted)" }}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
