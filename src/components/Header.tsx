"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const { user, profile, role, site, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = role === "admin" || role === "super_admin";
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

  function handleNavClick() {
    setMenuOpen(false);
  }

  function isActive(path: string) {
    return pathname === path || pathname.startsWith(path + "/");
  }

  return (
    <header
      className="border-b sticky top-0 z-50"
      style={{ background: "var(--sud-header)", borderColor: "var(--sud-header)" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight flex items-center gap-2" onClick={handleNavClick}>
          <span style={{ color: "var(--sud-yellow)" }}>SUD P2ST</span>
          {isAdmin && <span className="text-gray-400 text-sm font-normal hidden sm:inline">| Admin</span>}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {!loading && (
            <>
              {user ? (
                <>
                  <NavLink href="/surveys" active={isActive("/surveys")}>Sondages</NavLink>
                  {isAdmin && <NavLink href="/admin" active={isActive("/admin") && !isActive("/admin/users")}>Admin</NavLink>}
                  {role === "super_admin" && <NavLink href="/admin/users" active={isActive("/admin/users")}>Utilisateurs</NavLink>}

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
                  <NavLink href="/login" active={isActive("/login")}>Connexion</NavLink>
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

        {/* Mobile hamburger button */}
        {!loading && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
            aria-label="Menu"
          >
            <span
              className="block w-5 h-0.5 bg-white transition-transform origin-center"
              style={menuOpen ? { transform: "rotate(45deg) translateY(4px)" } : {}}
            />
            <span
              className="block w-5 h-0.5 bg-white transition-opacity"
              style={menuOpen ? { opacity: 0 } : {}}
            />
            <span
              className="block w-5 h-0.5 bg-white transition-transform origin-center"
              style={menuOpen ? { transform: "rotate(-45deg) translateY(-4px)" } : {}}
            />
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{ background: "var(--sud-header)", borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div className="px-4 py-4 space-y-1">
            {user ? (
              <>
                {/* User info */}
                <div className="pb-3 mb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <p className="text-white font-medium">{profile?.full_name || user.email}</p>
                  <p className="text-xs text-gray-400">
                    {site?.name ?? "Tous les sites"} — {role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : "Utilisateur"}
                  </p>
                </div>

                <MobileNavLink href="/" active={pathname === "/"} onClick={handleNavClick}>Accueil</MobileNavLink>
                <MobileNavLink href="/surveys" active={isActive("/surveys")} onClick={handleNavClick}>Sondages</MobileNavLink>
                {isAdmin && <MobileNavLink href="/admin" active={isActive("/admin") && !isActive("/admin/users")} onClick={handleNavClick}>Administration</MobileNavLink>}
                {role === "super_admin" && <MobileNavLink href="/admin/users" active={isActive("/admin/users")} onClick={handleNavClick}>Utilisateurs</MobileNavLink>}

                <div className="pt-3 mt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition text-gray-300 hover:text-white hover:bg-white/5"
                  >
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <>
                <MobileNavLink href="/login" active={isActive("/login")} onClick={handleNavClick}>Connexion</MobileNavLink>
                <Link
                  href="/signup"
                  onClick={handleNavClick}
                  className="block w-full text-center mt-2 px-4 py-2.5 rounded-lg text-sm font-medium transition text-white"
                  style={{ background: "#E60077" }}
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium transition"
      style={{ color: active ? "var(--sud-yellow)" : "#d1d5db" }}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, active, onClick, children }: { href: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2.5 rounded-lg text-sm font-medium transition"
      style={{
        color: active ? "var(--sud-yellow)" : "#d1d5db",
        background: active ? "rgba(255,255,255,0.05)" : "transparent",
      }}
    >
      {children}
    </Link>
  );
}
