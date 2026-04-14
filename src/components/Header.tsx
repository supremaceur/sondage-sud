"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, profile, role, site, loading, signOut } = useAuth();
  const router = useRouter();
  const isAdmin = role === "admin" || role === "super_admin";

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className="border-b backdrop-blur-sm sticky top-0 z-50"
      style={{ background: "rgba(17,17,17,0.95)", borderColor: "var(--sud-border)" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
          <span style={{ color: "#E60077" }}>SUD</span>
          <span className="text-white">Sondage</span>
        </Link>

        <nav className="flex items-center gap-6">
          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/surveys"
                    className="text-gray-300 hover:text-white transition text-sm font-medium"
                  >
                    Sondages
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-gray-300 hover:text-white transition text-sm font-medium"
                    >
                      Admin
                    </Link>
                  )}

                  {role === "super_admin" && (
                    <Link
                      href="/admin/users"
                      className="text-gray-300 hover:text-white transition text-sm font-medium"
                    >
                      Utilisateurs
                    </Link>
                  )}

                  <div className="flex flex-col items-end text-sm">
                    <span style={{ color: "var(--sud-yellow)" }}>
                      {profile?.full_name || user.email}
                    </span>
                    {site && (
                      <span className="text-xs text-gray-500">{site.name}</span>
                    )}
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 rounded text-sm font-medium transition border"
                    style={{
                      borderColor: "var(--sud-border)",
                      color: "#ccc",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#E60077";
                      e.currentTarget.style.color = "#E60077";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--sud-border)";
                      e.currentTarget.style.color = "#ccc";
                    }}
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-300 hover:text-white transition text-sm font-medium"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-1.5 rounded text-sm font-medium transition text-white"
                    style={{ background: "#E60077" }}
                  >
                    Inscription
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
