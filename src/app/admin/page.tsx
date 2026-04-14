"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Survey, Site } from "@/types";
import { useAuth } from "@/components/AuthProvider";

interface SurveyWithSite extends Survey {
  sites: { name: string } | null;
}

export default function AdminPage() {
  const { role, site } = useAuth();
  const [surveys, setSurveys] = useState<SurveyWithSite[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadSurveys();
  }, []);

  async function loadSurveys() {
    const { data } = await supabase
      .from("surveys")
      .select("*, sites(name)")
      .order("created_at", { ascending: false });

    setSurveys((data as SurveyWithSite[]) ?? []);
    setLoading(false);
  }

  async function toggleActive(survey: Survey) {
    await supabase
      .from("surveys")
      .update({ is_active: !survey.is_active })
      .eq("id", survey.id);

    loadSurveys();
  }

  async function deleteSurvey(id: string) {
    if (!confirm("Supprimer ce sondage et toutes ses données ?")) return;

    await supabase.from("surveys").delete().eq("id", id);
    loadSurveys();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
        <Link
          href="/admin/create"
          className="text-white px-4 py-2 rounded-lg font-medium transition"
          style={{ background: "#E60077" }}
        >
          + Nouveau sondage
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : surveys.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl border"
          style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <p className="text-gray-500 mb-4">Aucun sondage pour le moment.</p>
          <Link href="/admin/create" style={{ color: "var(--sud-yellow)" }} className="hover:underline">
            Créer votre premier sondage
          </Link>
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <table className="w-full">
            <thead style={{ borderBottom: "1px solid var(--sud-border)" }}>
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Titre</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Site</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Statut</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Date</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((survey) => (
                <tr
                  key={survey.id}
                  className="transition"
                  style={{ borderBottom: "1px solid var(--sud-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{survey.title}</p>
                      {survey.description && (
                        <p className="text-sm text-gray-500 truncate max-w-md">
                          {survey.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {survey.sites?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                      style={
                        survey.is_active
                          ? { background: "rgba(230,0,119,0.15)", color: "#E60077" }
                          : { background: "rgba(255,255,255,0.05)", color: "#888" }
                      }
                    >
                      {survey.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(survey.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/admin/results/${survey.id}`}
                        className="text-sm px-3 py-1 rounded border transition"
                        style={{
                          borderColor: "var(--sud-yellow)",
                          color: "var(--sud-yellow)",
                        }}
                      >
                        Résultats
                      </Link>
                      <button
                        onClick={() => toggleActive(survey)}
                        className="text-sm px-3 py-1 border rounded transition text-gray-400"
                        style={{ borderColor: "var(--sud-border)" }}
                      >
                        {survey.is_active ? "Désactiver" : "Activer"}
                      </button>
                      <button
                        onClick={() => deleteSurvey(survey.id)}
                        className="text-sm px-3 py-1 rounded border transition"
                        style={{ borderColor: "#E60077", color: "#E60077" }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
