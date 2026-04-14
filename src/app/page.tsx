"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { Survey } from "@/types";

export default function HomePage() {
  const { user, profile, role, site, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--sud-border)", borderTopColor: "#E60077" }} />
      </div>
    );
  }

  if (!user) return <LandingPage />;
  return <UserDashboard />;
}

// --- Landing page (non connecté) ---
function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div
        className="inline-block px-4 py-1 rounded-full text-xs font-medium mb-6"
        style={{ background: "var(--sud-pink-light)", color: "#E60077" }}
      >
        Plateforme de sondages SUD P2ST
      </div>

      <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
        <span style={{ color: "var(--sud-black)" }}>Bienvenue sur </span>
        <span style={{ color: "#E60077" }}>Sondage</span>
        <span style={{ color: "var(--sud-black)" }}> SUD</span>
      </h1>

      <p className="text-lg max-w-xl mb-8" style={{ color: "var(--sud-muted)" }}>
        Participez aux enquêtes et consultez les résultats en temps réel.
        Une plateforme simple, rapide et sécurisée.
      </p>

      <div className="flex gap-4">
        <Link
          href="/signup"
          className="px-6 py-3 rounded-lg font-medium transition text-white"
          style={{ background: "#E60077" }}
        >
          Inscription
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg font-medium transition border"
          style={{ borderColor: "var(--sud-border)", color: "var(--sud-black)" }}
        >
          Se connecter
        </Link>
      </div>
    </div>
  );
}

// --- Dashboard utilisateur (connecté) ---
function UserDashboard() {
  const { profile, role, site } = useAuth();
  const supabase = createClient();
  const isAdmin = role === "admin" || role === "super_admin";

  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [loadingSurveys, setLoadingSurveys] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: surveys } = await supabase
        .from("surveys")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setActiveSurveys((surveys as Survey[]) ?? []);

      const { data: responses } = await supabase
        .from("responses")
        .select("survey_id")
        .eq("user_id", profile!.id);

      setAnsweredIds(new Set((responses ?? []).map((r) => r.survey_id)));
      setLoadingSurveys(false);
    }
    if (profile) load();
  }, [profile]);

  const pending = activeSurveys.filter((s) => !answeredIds.has(s.id));
  const completed = activeSurveys.filter((s) => answeredIds.has(s.id));

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--sud-black)" }}>
          Bonjour, {profile?.full_name || ""}
        </h1>
        <p className="text-sm" style={{ color: "var(--sud-muted)" }}>
          {site ? site.name : "Tous les sites"} — {role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : "Utilisateur"}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div
          className="p-4 rounded-xl border shadow-sm"
          style={{ background: pending.length > 0 ? "var(--sud-pink-light)" : "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: pending.length > 0 ? "#E60077" : "var(--sud-muted)" }}>
            En attente
          </p>
          <p className="text-3xl font-bold" style={{ color: pending.length > 0 ? "#E60077" : "var(--sud-black)" }}>
            {loadingSurveys ? "—" : pending.length}
          </p>
        </div>
        <div className="p-4 rounded-xl border shadow-sm" style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sud-muted)" }}>Complétés</p>
          <p className="text-3xl font-bold" style={{ color: "var(--sud-black)" }}>
            {loadingSurveys ? "—" : completed.length}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin"
            className="p-4 rounded-xl border shadow-sm transition hover:border-pink-300"
            style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sud-muted)" }}>Administration</p>
            <p className="text-sm font-medium mt-2" style={{ color: "#E60077" }}>Accéder au dashboard &rarr;</p>
          </Link>
        )}
      </div>

      {/* Pending surveys */}
      {!loadingSurveys && pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--sud-black)" }}>
            Sondages à compléter
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {pending.map((survey) => (
              <Link
                key={survey.id}
                href={`/surveys/${survey.id}`}
                className="p-5 rounded-xl border shadow-sm transition hover:shadow-md flex items-center justify-between group"
                style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
              >
                <div>
                  <h3 className="font-semibold group-hover:text-pink-600 transition" style={{ color: "var(--sud-black)" }}>
                    {survey.title}
                  </h3>
                  {survey.description && (
                    <p className="text-sm mt-1 line-clamp-1" style={{ color: "var(--sud-muted)" }}>{survey.description}</p>
                  )}
                  <p className="text-xs mt-2" style={{ color: "#999" }}>
                    {new Date(survey.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white shrink-0 ml-4"
                  style={{ background: "#E60077" }}
                >
                  Participer
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Completed surveys */}
      {!loadingSurveys && completed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--sud-black)" }}>
            Déjà complétés
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {completed.map((survey) => (
              <div
                key={survey.id}
                className="p-5 rounded-xl border shadow-sm flex items-center justify-between"
                style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
              >
                <div>
                  <h3 className="font-semibold" style={{ color: "var(--sud-black)" }}>{survey.title}</h3>
                  <p className="text-xs mt-1" style={{ color: "#999" }}>
                    {new Date(survey.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: "var(--sud-pink-light)", color: "#E60077" }}
                >
                  Répondu
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loadingSurveys && activeSurveys.length === 0 && (
        <div
          className="text-center py-12 rounded-xl border shadow-sm"
          style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <p className="text-lg font-medium mb-2" style={{ color: "var(--sud-black)" }}>Aucun sondage actif</p>
          <p style={{ color: "var(--sud-muted)" }}>Revenez plus tard, de nouveaux sondages seront bientôt disponibles.</p>
        </div>
      )}
    </div>
  );
}
