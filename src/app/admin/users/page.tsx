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

  // Redirection si pas super_admin
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

  if (role !== "super_admin") return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion des utilisateurs</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} utilisateur{users.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
        >
          <table className="w-full">
            <thead style={{ borderBottom: "1px solid var(--sud-border)" }}>
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Utilisateur</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Site</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Rôle</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Inscription</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="transition"
                  style={{ borderBottom: "1px solid var(--sud-border)" }}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{user.full_name || "—"}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.site_id ?? ""}
                      onChange={(e) =>
                        updateUserSite(user.id, e.target.value || null)
                      }
                      className="px-2 py-1 rounded text-sm text-white border"
                      style={{
                        background: "var(--sud-black)",
                        borderColor: "var(--sud-border)",
                      }}
                    >
                      <option value="" style={{ background: "#111", color: "white" }}>Tous les sites</option>
                      {sites.map((site) => (
                        <option key={site.id} value={site.id} style={{ background: "#111", color: "white" }}>
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
                      className="px-2 py-1 rounded text-sm text-white border"
                      style={{
                        background: "var(--sud-black)",
                        borderColor: "var(--sud-border)",
                      }}
                    >
                      <option value="user" style={{ background: "#111", color: "white" }}>Utilisateur</option>
                      <option value="admin" style={{ background: "#111", color: "white" }}>Admin</option>
                      <option value="super_admin" style={{ background: "#111", color: "white" }}>Super Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
