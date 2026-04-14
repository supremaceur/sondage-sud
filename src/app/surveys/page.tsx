"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import type { Survey } from "@/types";

export default function SurveysPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: surveysData } = await supabase
        .from("surveys")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setSurveys((surveysData as Survey[]) ?? []);

      if (user) {
        const { data: responsesData } = await supabase
          .from("responses")
          .select("survey_id")
          .eq("user_id", user.id);

        const ids = new Set((responsesData ?? []).map((r) => r.survey_id));
        setAnsweredIds(ids);
      }

      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) {
    return <p className="text-gray-500">Chargement des sondages...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Sondages disponibles</h1>

      {surveys.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl border"
          style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <p className="text-gray-500">Aucun sondage disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => {
            const answered = answeredIds.has(survey.id);
            return (
              <div
                key={survey.id}
                className="rounded-xl p-6 flex flex-col justify-between border transition"
                style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
              >
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">
                    {survey.title}
                  </h2>
                  {survey.description && (
                    <p className="text-sm text-gray-500 mb-4">{survey.description}</p>
                  )}
                  <p className="text-xs text-gray-600">
                    Publié le {new Date(survey.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <div className="mt-4">
                  {answered ? (
                    <span
                      className="inline-block w-full text-center py-2.5 rounded-lg text-sm font-medium"
                      style={{ background: "rgba(255,245,157,0.1)", color: "var(--sud-yellow)" }}
                    >
                      Déjà répondu
                    </span>
                  ) : (
                    <Link
                      href={`/surveys/${survey.id}`}
                      className="block w-full text-center py-2.5 text-white rounded-lg font-medium transition"
                      style={{ background: "#E60077" }}
                    >
                      Participer
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
