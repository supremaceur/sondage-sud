"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const { user, profile, role, site, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = role === "admin" || role === "super_admin";
  const [menuOpen, setMenuOpen] = useState(false);

  // Fermer le menu quand on change de page
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Empêcher le scroll quand le menu est ouvert
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

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
    <>
      <header
        className="border-b sticky top-0 z-50"
        style={{ background: "var(--sud-header)", borderColor: "var(--sud-header)" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          {/* Mobile: hamburger à gauche */}
          {!loading && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden relative w-8 h-8 flex items-center justify-center"
              aria-label="Menu"
            >
              <span
                className="absolute block w-5 h-0.5 bg-white transition-all duration-300"
                style={menuOpen
                  ? { transform: "rotate(45deg)", top: "50%" }
                  : { top: "10px" }
                }
              />
              <span
                className="absolute block w-5 h-0.5 bg-white transition-all duration-300"
                style={menuOpen
                  ? { opacity: 0 }
                  : { top: "50%", transform: "translateY(-50%)" }
                }
              />
              <span
                className="absolute block w-5 h-0.5 bg-white transition-all duration-300"
                style={menuOpen
                  ? { transform: "rotate(-45deg)", top: "50%" }
                  : { bottom: "10px" }
                }
              />
            </button>
          )}

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

          {/* Spacer invisible pour équilibrer le layout mobile (hamburger à gauche, logo au centre) */}
          <div className="w-8 md:hidden" />
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 flex flex-col"
          style={{ top: "52px" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu panel */}
          <div
            className="relative w-full max-h-[80vh] overflow-y-auto"
            style={{ background: "var(--sud-header)" }}
          >
            <div className="px-5 py-5 space-y-1">
              {user ? (
                <>
                  {/* User info */}
                  <div className="pb-4 mb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <p className="text-white font-semibold text-base">{profile?.full_name || user.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {site?.name ?? "Tous les sites"} — {role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : "Utilisateur"}
                    </p>
                  </div>

                  <MobileNavLink href="/" active={pathname === "/"} onClick={handleNavClick}>
                    <MenuIcon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    Accueil
                  </MobileNavLink>
                  <MobileNavLink href="/surveys" active={isActive("/surveys")} onClick={handleNavClick}>
                    <MenuIcon d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                    Sondages
                  </MobileNavLink>
                  {isAdmin && (
                    <MobileNavLink href="/admin" active={isActive("/admin") && !isActive("/admin/users")} onClick={handleNavClick}>
                      <MenuIcon d="M12 6V4m0 2a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m-6 8a2 2 0 1 0 0-4m0 4a2 2 0 1 1 0-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 1 0 0-4m0 4a2 2 0 1 1 0-4m0 4v2m0-6V4" />
                      Administration
                    </MobileNavLink>
                  )}
                  {role === "super_admin" && (
                    <MobileNavLink href="/admin/users" active={isActive("/admin/users")} onClick={handleNavClick}>
                      <MenuIcon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      Utilisateurs
                    </MobileNavLink>
                  )}

                  <div className="pt-3 mt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <MobileNavLink href="/mentions-legales" active={isActive("/mentions-legales")} onClick={handleNavClick}>
                      <MenuIcon d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                      Mentions légales
                    </MobileNavLink>
                  </div>

                  <div className="pt-3 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition text-gray-300 hover:text-white hover:bg-white/5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Déconnexion
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <MobileNavLink href="/login" active={isActive("/login")} onClick={handleNavClick}>
                    <MenuIcon d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                    Connexion
                  </MobileNavLink>

                  <div className="pt-3 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <MobileNavLink href="/mentions-legales" active={isActive("/mentions-legales")} onClick={handleNavClick}>
                      <MenuIcon d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                      Mentions légales
                    </MobileNavLink>
                  </div>

                  <Link
                    href="/signup"
                    onClick={handleNavClick}
                    className="block w-full text-center mt-4 px-4 py-3 rounded-lg text-sm font-semibold transition text-white"
                    style={{ background: "#E60077" }}
                  >
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
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

function MenuIcon({ d }: { d: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function MobileNavLink({ href, active, onClick, children }: { href: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition"
      style={{
        color: active ? "var(--sud-yellow)" : "#d1d5db",
        background: active ? "rgba(255,255,255,0.08)" : "transparent",
      }}
    >
      {children}
    </Link>
  );
}
