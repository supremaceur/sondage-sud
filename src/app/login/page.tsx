"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="p-8 rounded-xl w-full max-w-md border"
        style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
      >
        <h1 className="text-2xl font-bold text-center text-white mb-6">
          Connexion
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 border"
              style={{
                background: "var(--sud-black)",
                borderColor: "var(--sud-border)",
                // @ts-expect-error CSS custom property
                "--tw-ring-color": "#E60077",
              }}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 border"
              style={{
                background: "var(--sud-black)",
                borderColor: "var(--sud-border)",
                // @ts-expect-error CSS custom property
                "--tw-ring-color": "#E60077",
              }}
            />
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
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Pas encore de compte ?{" "}
          <Link href="/signup" style={{ color: "var(--sud-yellow)" }} className="hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
