"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Survey, Question, Answer, Site } from "@/types";
import { useAuth } from "@/components/AuthProvider";

interface SurveyWithSite extends Survey {
  sites: { name: string } | null;
}

interface ResponseRow {
  id: string;
  survey_id: string;
  user_id: string;
  submitted_at: string;
}

export default function AdminPage() {
  const { role, site: userSite, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [surveys, setSurveys] = useState<SurveyWithSite[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [surveySitesMap, setSurveySitesMap] = useState<Record<string, string[]>>({});
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [siteFilter, setSiteFilter] = useState("");

  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const [surveysResult, responsesResult, surveySitesResult] = await Promise.all([
      supabase.from("surveys").select("*, sites(name)").order("created_at", { ascending: false }),
      supabase.from("responses").select("id, survey_id, user_id, submitted_at").order("submitted_at", { ascending: false }),
      supabase.from("survey_sites").select("survey_id, sites(name)"),
    ]);

    setSurveys((surveysResult.data as SurveyWithSite[]) ?? []);
    setResponses((responsesResult.data as ResponseRow[]) ?? []);

    // Construire la map survey_id → noms de sites
    const ssMap: Record<string, string[]> = {};
    ((surveySitesResult.data as unknown as { survey_id: string; sites: { name: string } | null }[]) ?? []).forEach((row) => {
      if (!ssMap[row.survey_id]) ssMap[row.survey_id] = [];
      if (row.sites?.name) ssMap[row.survey_id].push(row.sites.name);
    });
    setSurveySitesMap(ssMap);

    if (isSuperAdmin) {
      const [sitesResult, usersResult] = await Promise.all([
        supabase.from("sites").select("*").order("name"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      setSites((sitesResult.data as Site[]) ?? []);
      setTotalUsers(usersResult.count ?? 0);
    }

    setLoading(false);
  }

  async function toggleActive(survey: Survey) {
    await supabase.from("surveys").update({ is_active: !survey.is_active }).eq("id", survey.id);
    loadDashboard();
  }

  async function deleteSurvey(id: string) {
    if (!confirm("Supprimer ce sondage et toutes ses données ?")) return;
    await supabase.from("surveys").delete().eq("id", id);
    loadDashboard();
  }

  async function duplicateSurvey(survey: SurveyWithSite) {
    if (!user) return;

    // Dupliquer le sondage
    const { data: newSurvey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        title: `${survey.title} (copie)`,
        description: survey.description,
        created_by: user.id,
        site_id: survey.site_id,
        is_active: false,
      })
      .select("id")
      .single();

    if (surveyError || !newSurvey) return;

    // Dupliquer les questions
    const { data: questions } = await supabase
      .from("questions")
      .select("*")
      .eq("survey_id", survey.id)
      .order("position");

    if (questions && questions.length > 0) {
      await supabase.from("questions").insert(
        questions.map((q: Question) => ({
          survey_id: newSurvey.id,
          type: q.type,
          title: q.title,
          options: q.options,
          position: q.position,
        }))
      );
    }

    // Dupliquer les associations de sites
    const { data: surveySites } = await supabase
      .from("survey_sites")
      .select("site_id")
      .eq("survey_id", survey.id);

    if (surveySites && surveySites.length > 0) {
      await supabase.from("survey_sites").insert(
        surveySites.map((ss: { site_id: string }) => ({
          survey_id: newSurvey.id,
          site_id: ss.site_id,
        }))
      );
    }

    loadDashboard();
  }

  // Computed stats
  const filteredSurveys = siteFilter
    ? surveys.filter((s) => s.site_id === siteFilter)
    : surveys;

  const activeSurveys = filteredSurveys.filter((s) => s.is_active).length;
  const inactiveSurveys = filteredSurveys.length - activeSurveys;

  const surveyIds = new Set(filteredSurveys.map((s) => s.id));
  const filteredResponses = responses.filter((r) => surveyIds.has(r.survey_id));
  const totalResponses = filteredResponses.length;
  const uniqueParticipants = new Set(filteredResponses.map((r) => r.user_id)).size;
  const lastResponse = filteredResponses[0]?.submitted_at;

  const participationRate = totalUsers > 0
    ? Math.round((uniqueParticipants / totalUsers) * 100)
    : 0;

  // Per-survey response count
  const responseCountBySurvey: Record<string, number> = {};
  filteredResponses.forEach((r) => {
    responseCountBySurvey[r.survey_id] = (responseCountBySurvey[r.survey_id] || 0) + 1;
  });

  // Per-site response count (for super_admin)
  const responseBySite: Record<string, number> = {};
  if (isSuperAdmin) {
    filteredResponses.forEach((r) => {
      const survey = surveys.find((s) => s.id === r.survey_id);
      const siteName = survey?.sites?.name ?? "Sans site";
      responseBySite[siteName] = (responseBySite[siteName] || 0) + 1;
    });
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "#F0F0F0" }} />
          ))}
        </div>
        <div className="h-64 rounded-xl animate-pulse" style={{ background: "#F0F0F0" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--sud-black)" }}>Tableau de bord</h1>
          <p className="text-sm" style={{ color: "var(--sud-muted)" }}>Vue d'ensemble de la plateforme</p>
        </div>
        {isSuperAdmin && (
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ background: "#FAFAFA", borderColor: "var(--sud-border)", color: "var(--sud-black)" }}
          >
            <option value="">Tous les sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Sondages" value={filteredSurveys.length} sub={`${activeSurveys} actif${activeSurveys > 1 ? "s" : ""} · ${inactiveSurveys} terminé${inactiveSurveys > 1 ? "s" : ""}`} />
        <KpiCard label="Participants" value={uniqueParticipants} highlight sub={isSuperAdmin ? `${participationRate}% de participation` : undefined} />
        <KpiCard label="Réponses" value={totalResponses} />
        <KpiCard
          label="Dernière réponse"
          value={lastResponse ? new Date(lastResponse).toLocaleDateString("fr-FR") : "—"}
          sub={lastResponse ? timeAgo(lastResponse) : undefined}
        />
      </div>

      {/* Site breakdown (super_admin) */}
      {isSuperAdmin && Object.keys(responseBySite).length > 0 && (
        <div
          className="p-5 rounded-xl border shadow-sm"
          style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--sud-black)" }}>Répartition par site</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(responseBySite)
              .sort((a, b) => b[1] - a[1])
              .map(([siteName, count]) => (
                <div key={siteName} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "#FAFAFA" }}>
                  <span className="text-sm" style={{ color: "var(--sud-dark)" }}>{siteName}</span>
                  <span className="text-sm font-bold" style={{ color: "#E60077" }}>{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Surveys table */}
      <div>
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--sud-black)" }}>Sondages</h2>

        {filteredSurveys.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl border shadow-sm"
            style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
          >
            <p className="mb-4" style={{ color: "var(--sud-muted)" }}>Aucun sondage pour le moment.</p>
            <Link href="/admin/create" style={{ color: "#E60077" }} className="hover:underline font-medium">
              Créer votre premier sondage
            </Link>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden shadow-sm"
            style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
          >
            <table className="w-full">
              <thead style={{ borderBottom: "1px solid var(--sud-border)", background: "#FAFAFA" }}>
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Titre</th>
                  {isSuperAdmin && <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Site</th>}
                  <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Statut</th>
                  <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Réponses</th>
                  <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Date</th>
                  <th className="text-right px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSurveys.map((survey) => (
                  <tr
                    key={survey.id}
                    className="transition hover:bg-gray-50"
                    style={{ borderBottom: "1px solid var(--sud-border)" }}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium" style={{ color: "var(--sud-black)" }}>{survey.title}</p>
                        {survey.description && (
                          <p className="text-sm truncate max-w-xs" style={{ color: "var(--sud-muted)" }}>
                            {survey.description}
                          </p>
                        )}
                      </div>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-sm">
                        <SitesBadges
                          singleSiteName={survey.sites?.name}
                          multiSiteNames={surveySitesMap[survey.id]}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                        style={
                          survey.is_active
                            ? { background: "var(--sud-pink-light)", color: "#E60077" }
                            : { background: "#F5F5F5", color: "#999" }
                        }
                      >
                        {survey.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold" style={{ color: "#E60077" }}>
                        {responseCountBySurvey[survey.id] || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--sud-muted)" }}>
                      {new Date(survey.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1.5 justify-end flex-wrap">
                        <Link
                          href={`/admin/results/${survey.id}`}
                          className="text-xs px-2.5 py-1 rounded border transition font-medium"
                          style={{ borderColor: "#E60077", color: "#E60077" }}
                        >
                          Résultats
                        </Link>
                        <Link
                          href={`/admin/edit/${survey.id}`}
                          className="text-xs px-2.5 py-1 rounded border transition font-medium"
                          style={{ borderColor: "var(--sud-border)", color: "var(--sud-dark)" }}
                        >
                          Modifier
                        </Link>
                        <button
                          onClick={() => duplicateSurvey(survey)}
                          className="text-xs px-2.5 py-1 border rounded transition"
                          style={{ borderColor: "var(--sud-border)", color: "var(--sud-muted)" }}
                        >
                          Dupliquer
                        </button>
                        <button
                          onClick={() => toggleActive(survey)}
                          className="text-xs px-2.5 py-1 border rounded transition"
                          style={{ borderColor: "var(--sud-border)", color: "var(--sud-muted)" }}
                        >
                          {survey.is_active ? "Désactiver" : "Activer"}
                        </button>
                        <button
                          onClick={() => deleteSurvey(survey.id)}
                          className="text-xs px-2.5 py-1 rounded border transition"
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
    </div>
  );
}

// --- Sub-components ---

function KpiCard({ label, value, sub, highlight }: { label: string; value: string | number; sub?: string; highlight?: boolean }) {
  return (
    <div
      className="p-4 rounded-xl border shadow-sm"
      style={{
        background: highlight ? "var(--sud-pink-light)" : "var(--sud-card)",
        borderColor: "var(--sud-border)",
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: highlight ? "#E60077" : "var(--sud-muted)" }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: highlight ? "#E60077" : "var(--sud-black)" }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: "var(--sud-muted)" }}>{sub}</p>
      )}
    </div>
  );
}

function SitesBadges({ singleSiteName, multiSiteNames }: { singleSiteName?: string; multiSiteNames?: string[] }) {
  // Multi-sites from survey_sites table
  if (multiSiteNames && multiSiteNames.length > 0) {
    if (multiSiteNames.length <= 3) {
      return (
        <div className="flex flex-wrap gap-1">
          {multiSiteNames.map((name) => (
            <span
              key={name}
              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: "var(--sud-yellow-soft)", color: "var(--sud-dark)" }}
            >
              {name}
            </span>
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-1 items-center">
        {multiSiteNames.slice(0, 2).map((name) => (
          <span
            key={name}
            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: "var(--sud-yellow-soft)", color: "var(--sud-dark)" }}
          >
            {name}
          </span>
        ))}
        <span
          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: "#F0F0F0", color: "var(--sud-muted)" }}
          title={multiSiteNames.join(", ")}
        >
          +{multiSiteNames.length - 2}
        </span>
      </div>
    );
  }

  // Single site from direct site_id relation
  if (singleSiteName) {
    return (
      <span
        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ background: "var(--sud-yellow-soft)", color: "var(--sud-dark)" }}
      >
        {singleSiteName}
      </span>
    );
  }

  // No sites = all sites
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: "var(--sud-pink-light)", color: "#E60077" }}
    >
      Tous les sites
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return `Il y a ${Math.floor(days / 7)} sem.`;
}
