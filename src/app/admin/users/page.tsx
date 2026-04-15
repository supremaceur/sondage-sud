"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import type { Profile, Site, UserRole } from "@/types";

interface ProfileWithSite extends Profile {
  sites: { name: string } | null;
}

export default function UsersPage() {
  const { role } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [users, setUsers] = useState<ProfileWithSite[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (role && role !== "super_admin") {
      router.push("/admin");
    }
  }, [role]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [{ data: usersData }, { data: sitesData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("*, sites(name)")
        .order("created_at", { ascending: false }),
      supabase.from("sites").select("*").order("name"),
    ]);

    setUsers((usersData as ProfileWithSite[]) ?? []);
    setSites((sitesData as Site[]) ?? []);
    setLoading(false);
  }

  async function updateUserRole(userId: string, newRole: UserRole) {
    await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    loadData();
  }

  async function updateUserSite(userId: string, siteId: string | null) {
    await supabase
      .from("profiles")
      .update({ site_id: siteId })
      .eq("id", userId);

    loadData();
  }

  async function handleExportUserData(userId: string, userEmail: string) {
    setExporting(userId);
    try {
      const res = await fetch(`/api/rgpd/export?userId=${userId}`);

      if (!res.ok) {
        // L'API renvoie du JSON en cas d'erreur
        const data = await res.json();
        alert(data.error || "Erreur lors de l'export.");
        return;
      }

      // Télécharger le fichier Excel
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, "_");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `export_utilisateur_${safeEmail}_${date}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur de connexion au serveur.");
    } finally {
      setExporting(null);
    }
  }

  if (role !== "super_admin") return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--sud-black)" }}>Gestion des utilisateurs</h1>
          <p className="text-sm mt-1" style={{ color: "var(--sud-muted)" }}>{users.length} utilisateur{users.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--sud-muted)" }}>Chargement...</p>
      ) : (
        <>
          {/* Desktop: Table */}
          <div
            className="hidden md:block rounded-xl border overflow-hidden shadow-sm"
            style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
          >
            <table className="w-full">
              <thead style={{ borderBottom: "1px solid var(--sud-border)", background: "#FAFAFA" }}>
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Utilisateur</th>
                  <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Site</th>
                  <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Rôle</th>
                  <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Inscription</th>
                  <th className="text-right px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>RGPD</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-gray-50"
                    style={{ borderBottom: "1px solid var(--sud-border)" }}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium" style={{ color: "var(--sud-black)" }}>{user.full_name || "—"}</p>
                        <p className="text-xs" style={{ color: "var(--sud-muted)" }}>{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.site_id ?? ""}
                        onChange={(e) =>
                          updateUserSite(user.id, e.target.value || null)
                        }
                        className="px-2 py-1 rounded text-sm border"
                        style={{
                          background: "#FAFAFA",
                          borderColor: "var(--sud-border)",
                          color: "var(--sud-black)",
                        }}
                      >
                        <option value="">Tous les sites</option>
                        {sites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          updateUserRole(user.id, e.target.value as UserRole)
                        }
                        className="px-2 py-1 rounded text-sm border"
                        style={{
                          background: "#FAFAFA",
                          borderColor: "var(--sud-border)",
                          color: "var(--sud-black)",
                        }}
                      >
                        <option value="user">Utilisateur</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--sud-muted)" }}>
                      {new Date(user.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleExportUserData(user.id, user.email)}
                        disabled={exporting === user.id}
                        className="text-xs px-3 py-1.5 rounded border transition font-medium disabled:opacity-50"
                        style={{ borderColor: "#E60077", color: "#E60077" }}
                      >
                        {exporting === user.id ? "Export..." : "Exporter données"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-xl border shadow-sm p-4 space-y-3"
                style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
              >
                <div>
                  <p className="font-semibold" style={{ color: "var(--sud-black)" }}>{user.full_name || "—"}</p>
                  <p className="text-xs" style={{ color: "var(--sud-muted)" }}>{user.email}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span
                    className="px-2 py-1 rounded-full font-medium"
                    style={{
                      background: user.role === "super_admin" ? "var(--sud-pink-light)" : user.role === "admin" ? "var(--sud-yellow-soft)" : "#F5F5F5",
                      color: user.role === "super_admin" ? "#E60077" : user.role === "admin" ? "var(--sud-dark)" : "var(--sud-muted)",
                    }}
                  >
                    {user.role === "super_admin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Utilisateur"}
                  </span>
                  {user.sites?.name && (
                    <span
                      className="px-2 py-1 rounded-full font-medium"
                      style={{ background: "var(--sud-yellow-soft)", color: "var(--sud-dark)" }}
                    >
                      {user.sites.name}
                    </span>
                  )}
                  <span style={{ color: "var(--sud-muted)" }}>
                    Inscrit le {new Date(user.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>

                <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid var(--sud-border)" }}>
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                    className="flex-1 px-2 py-2 rounded-lg text-xs border"
                    style={{ background: "#FAFAFA", borderColor: "var(--sud-border)", color: "var(--sud-black)" }}
                  >
                    <option value="user">Utilisateur</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <select
                    value={user.site_id ?? ""}
                    onChange={(e) => updateUserSite(user.id, e.target.value || null)}
                    className="flex-1 px-2 py-2 rounded-lg text-xs border"
                    style={{ background: "#FAFAFA", borderColor: "var(--sud-border)", color: "var(--sud-black)" }}
                  >
                    <option value="">Tous les sites</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleExportUserData(user.id, user.email)}
                  disabled={exporting === user.id}
                  className="w-full text-xs px-3 py-2 rounded-lg border transition font-medium disabled:opacity-50"
                  style={{ borderColor: "#E60077", color: "#E60077" }}
                >
                  {exporting === user.id ? "Export en cours..." : "Exporter les données (RGPD)"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
