"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MAGIC_LINK_EXPIRY = 300; // 5 minutes en secondes

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkMode, setMagicLinkMode] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [countdown, setCountdown] = useState(MAGIC_LINK_EXPIRY);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  // Gérer les erreurs provenant du callback (ex: lien expiré)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam === "magic_link_expired") {
      setError("Le lien magique a expiré. Veuillez en demander un nouveau.");
      setMagicLinkMode(true);
    } else if (errorParam === "auth") {
      setError("Erreur d'authentification. Veuillez réessayer.");
    }
  }, []);

  // Timer de countdown après envoi du magic link
  useEffect(() => {
    if (!magicLinkSent) return;

    setCountdown(MAGIC_LINK_EXPIRY);
    setCanResend(false);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [magicLinkSent]);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const sendMagicLink = useCallback(async (targetEmail: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'envoi.");
        setLoading(false);
        return false;
      }

      setMagicLinkSent(true);
      setLoading(false);
      return true;
    } catch {
      setError("Erreur de connexion au serveur.");
      setLoading(false);
      return false;
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (magicLinkMode) {
      await sendMagicLink(email);
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

  async function handleResend() {
    await sendMagicLink(email);
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
            {/* Icône email */}
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ background: "var(--sud-pink-light)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E60077" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>

            <h2 className="text-lg font-semibold" style={{ color: "var(--sud-black)" }}>
              Vérifiez votre boîte mail
            </h2>

            <p className="text-sm" style={{ color: "var(--sud-muted)" }}>
              Un lien de connexion a été envoyé à <strong style={{ color: "var(--sud-black)" }}>{email}</strong>.
              <br />Cliquez sur le lien dans l&apos;email pour vous connecter.
            </p>

            {/* Timer d'expiration */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
              style={{
                background: countdown > 0 ? "var(--sud-yellow-soft)" : "var(--sud-pink-light)",
                color: countdown > 0 ? "var(--sud-dark)" : "#E60077",
              }}
            >
              {countdown > 0 ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>Le lien expire dans <strong>{formatTime(countdown)}</strong></span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  <span>Le lien a expiré</span>
                </>
              )}
            </div>

            {/* Bouton renvoyer */}
            {canResend && (
              <button
                onClick={handleResend}
                disabled={loading}
                className="w-full text-white py-2.5 px-4 rounded-lg font-medium transition disabled:opacity-50"
                style={{ background: "#E60077" }}
              >
                {loading ? "Envoi..." : "Renvoyer un lien magique"}
              </button>
            )}

            {error && (
              <p className="text-sm" style={{ color: "#E60077" }}>{error}</p>
            )}

            <button
              onClick={() => { setMagicLinkSent(false); setMagicLinkMode(false); setError(null); }}
              className="text-sm hover:underline"
              style={{ color: "var(--sud-muted)" }}
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
                onClick={() => { setMagicLinkMode(false); setError(null); }}
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
                onClick={() => { setMagicLinkMode(true); setError(null); }}
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
                <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "var(--sud-yellow-soft)", color: "var(--sud-dark)" }}>
                  <p>Un lien de connexion sera envoyé à votre adresse email.</p>
                  <p>Aucun mot de passe requis. <strong>Le lien expire dans 5 minutes.</strong></p>
                </div>
              )}

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
                {loading
                  ? (magicLinkMode ? "Envoi..." : "Connexion...")
                  : (magicLinkMode ? "Envoyer le lien magique" : "Se connecter")}
              </button>
            </form>

            {/* Séparateur */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: "var(--sud-border)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--sud-muted)" }}>ou</span>
              <div className="flex-1 h-px" style={{ background: "var(--sud-border)" }} />
            </div>

            {/* Bouton Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border font-medium text-sm transition hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: "var(--sud-border)", color: "var(--sud-black)", background: "white" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.4l3.66-2.84.01-.47z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Connexion..." : "Se connecter avec Google"}
            </button>

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
