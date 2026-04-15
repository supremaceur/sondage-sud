"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import SiteSelect from "@/components/SiteSelect";

export default function CompleteProfilePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [siteId, setSiteId] = useState("");
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!siteId) {
      setError("Veuillez sélectionner votre site.");
      return;
    }

    if (!user) return;

    setLoading(true);

    // Résoudre le site_id si c'est un nom (fallback)
    let resolvedSiteId = siteId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(siteId);
    if (!isUuid) {
      const { data: siteRow } = await supabase
        .from("sites")
        .select("id")
        .eq("name", siteId)
        .single();
      if (siteRow) {
        resolvedSiteId = siteRow.id;
      }
    }

    const update: Record<string, unknown> = { site_id: resolvedSiteId };
    if (fullName.trim()) {
      update.full_name = fullName.trim();
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id);

    if (updateError) {
      setError("Erreur lors de la mise à jour. Réessayez.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="p-8 rounded-xl w-full max-w-md border shadow-sm"
        style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
      >
        {/* Icône */}
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: "var(--sud-yellow-soft)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--sud-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: "var(--sud-black)" }}>
          Compléter votre profil
        </h1>
        <p className="text-sm text-center mb-6" style={{ color: "var(--sud-muted)" }}>
          Pour continuer, veuillez renseigner votre site de rattachement.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>
              Nom complet
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={user?.user_metadata?.full_name || "Votre nom"}
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 border"
              style={{ background: "#FAFAFA", borderColor: "var(--sud-border)", color: "var(--sud-black)" }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>
              Site <span style={{ color: "#E60077" }}>*</span>
            </label>
            <SiteSelect value={siteId} onChange={setSiteId} />
          </div>

          {error && (
            <p className="text-sm p-3 rounded-lg" style={{ background: "var(--sud-pink-light)", color: "#E60077" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-2.5 px-4 rounded-lg font-medium transition disabled:opacity-50"
            style={{ background: "#E60077" }}
          >
            {loading ? "Enregistrement..." : "Continuer"}
          </button>
        </form>
      </div>
    </div>
  );
}
