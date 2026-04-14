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
      className="border-b sticky top-0 z-50"
      style={{ background: "var(--sud-header)", borderColor: "var(--sud-header)" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
          <span style={{ color: "var(--sud-yellow)" }}>SUD P2ST</span>
          {isAdmin && <span className="text-gray-400 text-sm font-normal">| Admin</span>}
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
                    <span className="text-white font-medium">
                      {profile?.full_name || user.email}
                    </span>
                    {site && (
                      <span className="text-xs text-gray-400">{site.name}</span>
                    )}
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 rounded text-sm font-medium transition text-gray-300 hover:text-white"
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
