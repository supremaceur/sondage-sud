"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import type { Survey } from "@/types";

export default function SurveysPage() {
  const { user, role, profile } = useAuth();
  const isAdmin = role === "admin" || role === "super_admin";
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

      // Filtrer : afficher seulement les sondages de son site ou sans site (tous)
      const userSiteId = profile?.site_id;
      const filtered = (surveysData as Survey[] ?? []).filter((s) => {
        if (!s.site_id) return true; // Sondage pour tous les sites
        if (!userSiteId) return true; // Utilisateur sans site → voit tout (super_admin)
        return s.site_id === userSiteId; // Sondage du même site
      });

      setSurveys(filtered);

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
  }, [user, profile]);

  if (loading) {
    return <p style={{ color: "var(--sud-muted)" }}>Chargement des sondages...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--sud-black)" }}>Sondages disponibles</h1>
        {isAdmin && (
          <Link
            href="/admin/create"
            className="text-white px-4 py-2 rounded-lg font-medium transition"
            style={{ background: "#E60077" }}
          >
            + Nouveau sondage
          </Link>
        )}
      </div>

      {surveys.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl border shadow-sm"
          style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <p style={{ color: "var(--sud-muted)" }}>Aucun sondage disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => {
            const answered = answeredIds.has(survey.id);
            return (
              <div
                key={survey.id}
                className="rounded-xl p-6 flex flex-col justify-between border shadow-sm transition"
                style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
              >
                <div>
                  <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--sud-black)" }}>
                    {survey.title}
                  </h2>
                  {survey.description && (
                    <p className="text-sm mb-4" style={{ color: "var(--sud-muted)" }}>{survey.description}</p>
                  )}
                  <p className="text-xs" style={{ color: "#999" }}>
                    Publié le {new Date(survey.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <div className="mt-4">
                  {answered ? (
                    <span
                      className="inline-block w-full text-center py-2.5 rounded-lg text-sm font-medium"
                      style={{ background: "var(--sud-pink-light)", color: "#E60077" }}
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
