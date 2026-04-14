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
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkMode, setMagicLinkMode] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (magicLinkMode) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setMagicLinkSent(true);
      setLoading(false);
      return;
    }

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
          Connexion
        </h1>

        {magicLinkSent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ background: "var(--sud-pink-light)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E60077" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--sud-black)" }}>
              Vérifiez votre boîte mail
            </h2>
            <p className="text-sm" style={{ color: "var(--sud-muted)" }}>
              Un lien de connexion a été envoyé à <strong style={{ color: "var(--sud-black)" }}>{email}</strong>.
              <br />Cliquez sur le lien dans l'email pour vous connecter.
            </p>
            <button
              onClick={() => { setMagicLinkSent(false); setMagicLinkMode(false); }}
              className="text-sm hover:underline"
              style={{ color: "#E60077" }}
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <>
            {/* Tabs mot de passe / magic link */}
            <div className="flex mb-6 rounded-lg overflow-hidden border" style={{ borderColor: "var(--sud-border)" }}>
              <button
                type="button"
                onClick={() => setMagicLinkMode(false)}
                className="flex-1 py-2.5 text-sm font-medium transition"
                style={{
                  background: !magicLinkMode ? "var(--sud-pink-light)" : "#FAFAFA",
                  color: !magicLinkMode ? "#E60077" : "var(--sud-muted)",
                }}
              >
                Mot de passe
              </button>
              <button
                type="button"
                onClick={() => setMagicLinkMode(true)}
                className="flex-1 py-2.5 text-sm font-medium transition"
                style={{
                  background: magicLinkMode ? "var(--sud-pink-light)" : "#FAFAFA",
                  color: magicLinkMode ? "#E60077" : "var(--sud-muted)",
                }}
              >
                Lien magique
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
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

              {!magicLinkMode && (
                <>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>
                      Mot de passe
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 border pr-10"
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--sud-muted)" }}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: "#E60077" }}>
                      Mot de passe oublié ?
                    </Link>
                  </div>
                </>
              )}

              {magicLinkMode && (
                <p className="text-xs" style={{ color: "var(--sud-muted)" }}>
                  Un lien de connexion sera envoyé à votre adresse email. Aucun mot de passe requis.
                </p>
              )}

              {error && (
                <p className="text-sm" style={{ color: "#E60077" }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-2.5 px-4 rounded-lg font-medium transition disabled:opacity-50"
                style={{ background: "#E60077" }}
              >
                {loading
                  ? (magicLinkMode ? "Envoi..." : "Connexion...")
                  : (magicLinkMode ? "Envoyer le lien magique" : "Se connecter")}
              </button>
            </form>

            <p className="mt-4 text-center text-sm" style={{ color: "var(--sud-muted)" }}>
              Pas encore de compte ?{" "}
              <Link href="/signup" style={{ color: "#E60077" }} className="hover:underline font-medium">
                Créer un compte
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
