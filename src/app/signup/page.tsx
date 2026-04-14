"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteSelect from "@/components/SiteSelect";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!siteId) {
      setError("Veuillez sélectionner votre site.");
      return;
    }

    setLoading(true);

    // Si siteId est un nom (fallback), résoudre en UUID
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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, site_id: resolvedSiteId },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  const inputStyle = {
    background: "#FAFAFA",
    borderColor: "var(--sud-border)",
    color: "var(--sud-black)",
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="p-8 rounded-xl w-full max-w-md border shadow-sm"
        style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
      >
        <h1 className="text-2xl font-bold text-center mb-6" style={{ color: "var(--sud-black)" }}>
          Créer un compte
        </h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>
              Nom complet
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 border"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 border"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 border"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>
              Site
            </label>
            <SiteSelect value={siteId} onChange={setSiteId} />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#E60077" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-2.5 px-4 rounded-lg font-medium transition disabled:opacity-50"
            style={{ background: "#E60077" }}
          >
            {loading ? "Création..." : "Créer un compte"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm" style={{ color: "var(--sud-muted)" }}>
          Déjà un compte ?{" "}
          <Link href="/login" style={{ color: "#E60077" }} className="hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
