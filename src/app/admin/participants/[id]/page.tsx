"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface Participant {
  responseId: string;
  userId: string;
  fullName: string | null;
  email: string;
  siteName: string | null;
  submittedAt: string;
}

export default function ParticipantsPage() {
  const { id } = useParams<{ id: string }>();
  const { role, profile: userProfile } = useAuth();
  const supabase = createClient();
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin";

  const [surveyTitle, setSurveyTitle] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    // Charger le sondage
    const { data: survey } = await supabase
      .from("surveys")
      .select("title")
      .eq("id", id)
      .single();

    setSurveyTitle(survey?.title ?? "");

    // Charger les réponses avec les profils
    const { data: responses } = await supabase
      .from("responses")
      .select("id, user_id, submitted_at")
      .eq("survey_id", id)
      .order("submitted_at", { ascending: false });

    if (!responses || responses.length === 0) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    const userIds = responses.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, site_id")
      .in("id", userIds);

    // Charger les sites
    const siteIds = [...new Set((profiles ?? []).map((p) => p.site_id).filter(Boolean))];
    let sitesMap: Record<string, string> = {};
    if (siteIds.length > 0) {
      const { data: sites } = await supabase
        .from("sites")
        .select("id, name")
        .in("id", siteIds as string[]);
      (sites ?? []).forEach((s) => { sitesMap[s.id] = s.name; });
    }

    const profilesMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    let result: Participant[] = responses.map((r) => {
      const p = profilesMap.get(r.user_id);
      return {
        responseId: r.id,
        userId: r.user_id,
        fullName: p?.full_name ?? null,
        email: p?.email ?? "—",
        siteName: p?.site_id ? (sitesMap[p.site_id] ?? null) : null,
        submittedAt: r.submitted_at,
      };
    });

    // Admin (non super_admin) : ne montrer que les participants de son site
    if (isAdmin && userProfile?.site_id) {
      const siteProfiles = new Set(
        (profiles ?? []).filter((p) => p.site_id === userProfile.site_id).map((p) => p.id)
      );
      result = result.filter((r) => siteProfiles.has(r.userId));
    }

    setParticipants(result);
    setLoading(false);
  }

  async function deleteParticipation(responseId: string) {
    if (!confirm("Supprimer cette participation ? L'utilisateur pourra reparticiper au sondage.")) return;

    setDeleting(responseId);

    // Supprimer les réponses (answers) puis la participation (response)
    await supabase.from("answers").delete().eq("response_id", responseId);
    await supabase.from("responses").delete().eq("id", responseId);

    setParticipants((prev) => prev.filter((p) => p.responseId !== responseId));
    setDeleting(null);
  }

  const filtered = search.trim()
    ? participants.filter((p) =>
        (p.fullName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        (p.siteName ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : participants;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded animate-pulse" style={{ background: "#F0F0F0" }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ background: "#F0F0F0" }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin" className="text-sm hover:underline mb-2 inline-block" style={{ color: "#E60077" }}>
          &larr; Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--sud-black)" }}>
          Participants
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--sud-muted)" }}>
          {surveyTitle} — <strong style={{ color: "#E60077" }}>{participants.length}</strong> participant{participants.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Recherche */}
      {participants.length > 0 && (
        <input
          type="text"
          placeholder="Rechercher par nom, email ou site..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
          style={{ background: "#FAFAFA", borderColor: "var(--sud-border)", color: "var(--sud-black)" }}
        />
      )}

      {/* Pas de participants */}
      {participants.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl border shadow-sm"
          style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <p style={{ color: "var(--sud-muted)" }}>Aucun participant pour ce sondage.</p>
        </div>
      ) : (
        <>
          {/* Desktop: Table */}
          <div
            className="hidden md:block rounded-xl border overflow-hidden shadow-sm"
            style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
          >
            <table className="w-full">
              <thead style={{ borderBottom: "1px solid var(--sud-border)", background: "#FAFAFA" }}>
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Nom</th>
                  <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Email</th>
                  {isSuperAdmin && <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Site</th>}
                  <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Date</th>
                  <th className="text-right px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.responseId}
                    className="transition hover:bg-gray-50"
                    style={{ borderBottom: "1px solid var(--sud-border)" }}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: "var(--sud-black)" }}>
                        {p.fullName || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--sud-dark)" }}>
                      {p.email}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-sm">
                        {p.siteName ? (
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: "var(--sud-yellow-soft)", color: "var(--sud-dark)" }}
                          >
                            {p.siteName}
                          </span>
                        ) : (
                          <span style={{ color: "var(--sud-muted)" }}>—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--sud-muted)" }}>
                      {new Date(p.submittedAt).toLocaleDateString("fr-FR")}{" "}
                      <span className="text-xs">
                        {new Date(p.submittedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteParticipation(p.responseId)}
                        disabled={deleting === p.responseId}
                        className="text-xs px-3 py-1.5 rounded border transition font-medium disabled:opacity-50"
                        style={{ borderColor: "#E60077", color: "#E60077" }}
                      >
                        {deleting === p.responseId ? "Suppression..." : "Supprimer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((p) => (
              <div
                key={p.responseId}
                className="rounded-xl border shadow-sm p-4 space-y-3"
                style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: "var(--sud-black)" }}>
                      {p.fullName || "—"}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--sud-muted)" }}>{p.email}</p>
                  </div>
                  {p.siteName && (
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                      style={{ background: "var(--sud-yellow-soft)", color: "var(--sud-dark)" }}
                    >
                      {p.siteName}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--sud-muted)" }}>
                    {new Date(p.submittedAt).toLocaleDateString("fr-FR")} à{" "}
                    {new Date(p.submittedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <button
                    onClick={() => deleteParticipation(p.responseId)}
                    disabled={deleting === p.responseId}
                    className="text-xs px-3 py-1.5 rounded-lg border transition font-medium disabled:opacity-50"
                    style={{ borderColor: "#E60077", color: "#E60077" }}
                  >
                    {deleting === p.responseId ? "..." : "Supprimer"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Résultats filtrés */}
          {search && filtered.length === 0 && (
            <p className="text-center text-sm py-4" style={{ color: "var(--sud-muted)" }}>
              Aucun résultat pour &quot;{search}&quot;
            </p>
          )}

          {filtered.length > 0 && filtered.length !== participants.length && (
            <p className="text-center text-xs" style={{ color: "var(--sud-muted)" }}>
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""} sur {participants.length}
            </p>
          )}
        </>
      )}
    </div>
  );
}
