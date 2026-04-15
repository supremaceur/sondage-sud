"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import type { Profile, Site, UserRole } from "@/types";

interface ProfileWithSite extends Profile {
  sites: { name: string } | null;
}

interface EditingUser {
  id: string;
  full_name: string;
  email: string;
  site_id: string | null;
}

export default function UsersPage() {
  const { role, profile: currentProfile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin" || role === "super_admin";

  const [users, setUsers] = useState<ProfileWithSite[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Modal d'édition
  const [editing, setEditing] = useState<EditingUser | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Accès : admin ou super_admin uniquement
  useEffect(() => {
    if (role && !isAdmin) {
      router.push("/");
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

  // ── Permissions ──

  /** Un admin peut-il modifier cet utilisateur ? */
  function canEdit(targetUser: ProfileWithSite): boolean {
    if (isSuperAdmin) return true;
    // Admin classique : ne peut pas modifier super_admin, ni admin, ni soi-même
    if (targetUser.role === "super_admin" || targetUser.role === "admin") return false;
    if (targetUser.id === currentProfile?.id) return false;
    return true;
  }

  /** Un admin peut-il changer le rôle de cet utilisateur ? */
  function canChangeRole(targetUser: ProfileWithSite): boolean {
    if (isSuperAdmin) return true;
    return false; // Les admins classiques ne peuvent pas changer les rôles
  }

  /** Rôles disponibles dans le sélecteur selon le rôle du caller */
  function availableRoles(): { value: UserRole; label: string }[] {
    if (isSuperAdmin) {
      return [
        { value: "user", label: "Utilisateur" },
        { value: "admin", label: "Admin" },
        { value: "super_admin", label: "Super Admin" },
      ];
    }
    return [{ value: "user", label: "Utilisateur" }];
  }

  // ── Actions ──

  async function updateUserRole(userId: string, newRole: UserRole) {
    if (!isSuperAdmin) return;
    await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    loadData();
  }

  async function updateUserSite(userId: string, siteId: string | null) {
    const res = await fetch("/api/admin/update-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, site_id: siteId }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erreur.");
      return;
    }
    loadData();
  }

  function openEditModal(user: ProfileWithSite) {
    setEditing({
      id: user.id,
      full_name: user.full_name ?? "",
      email: user.email,
      site_id: user.site_id,
    });
    setEditSuccess(null);
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSaving(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const targetUser = users.find((u) => u.id === editing.id);
      if (!targetUser) return;

      const originalEmail = targetUser.email;
      const emailChanged = editing.email !== originalEmail;

      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editing.id,
          full_name: editing.full_name,
          email: emailChanged ? editing.email : undefined,
          site_id: editing.site_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Erreur lors de la modification.");
        return;
      }

      if (emailChanged) {
        setEditSuccess(
          "Modifications enregistrées. Un email de confirmation a été envoyé à la nouvelle adresse. Le changement d'email sera effectif après confirmation."
        );
      } else {
        setEditSuccess("Modifications enregistrées.");
      }

      loadData();
    } catch {
      setEditError("Erreur de connexion au serveur.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportUserData(userId: string, userEmail: string) {
    setExporting(userId);
    try {
      const res = await fetch(`/api/rgpd/export?userId=${userId}`);
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'export.");
        return;
      }
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

  // ── Filtrage ──

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.sites?.name ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : users;

  // ── Rendu ──

  if (!isAdmin) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--sud-black)" }}>
            Gestion des utilisateurs
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--sud-muted)" }}>
            {users.length} utilisateur{users.length > 1 ? "s" : ""}
            {!isSuperAdmin && (
              <span className="ml-2 text-xs">(droits limités)</span>
            )}
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      {!loading && users.length > 0 && (
        <input
          type="text"
          placeholder="Rechercher par nom, email ou site..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 mb-4"
          style={{ background: "#FAFAFA", borderColor: "var(--sud-border)", color: "var(--sud-black)" }}
        />
      )}

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
                  <th className="text-right px-4 py-3 text-sm font-medium" style={{ color: "var(--sud-muted)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const editable = canEdit(user);
                  const roleEditable = canChangeRole(user);

                  return (
                    <tr
                      key={user.id}
                      className="transition hover:bg-gray-50"
                      style={{
                        borderBottom: "1px solid var(--sud-border)",
                        opacity: editable ? 1 : 0.6,
                      }}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium" style={{ color: "var(--sud-black)" }}>
                            {user.full_name || "—"}
                          </p>
                          <p className="text-xs" style={{ color: "var(--sud-muted)" }}>{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editable ? (
                          <select
                            value={user.site_id ?? ""}
                            onChange={(e) => updateUserSite(user.id, e.target.value || null)}
                            className="px-2 py-1 rounded text-sm border"
                            style={{ background: "#FAFAFA", borderColor: "var(--sud-border)", color: "var(--sud-black)" }}
                          >
                            <option value="">Aucun site</option>
                            {sites.map((site) => (
                              <option key={site.id} value={site.id}>{site.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm" style={{ color: "var(--sud-dark)" }}>
                            {user.sites?.name ?? "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {roleEditable ? (
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                            className="px-2 py-1 rounded text-sm border"
                            style={{ background: "#FAFAFA", borderColor: "var(--sud-border)", color: "var(--sud-black)" }}
                          >
                            {availableRoles().map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: user.role === "super_admin" ? "var(--sud-pink-light)" : user.role === "admin" ? "var(--sud-yellow-soft)" : "#F5F5F5",
                              color: user.role === "super_admin" ? "#E60077" : user.role === "admin" ? "var(--sud-dark)" : "var(--sud-muted)",
                            }}
                          >
                            {user.role === "super_admin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Utilisateur"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--sud-muted)" }}>
                        {new Date(user.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {editable && (
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-xs px-3 py-1.5 rounded border transition font-medium"
                            style={{ borderColor: "var(--sud-border)", color: "var(--sud-dark)" }}
                          >
                            Modifier
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleExportUserData(user.id, user.email)}
                            disabled={exporting === user.id}
                            className="text-xs px-3 py-1.5 rounded border transition font-medium disabled:opacity-50"
                            style={{ borderColor: "#E60077", color: "#E60077" }}
                          >
                            {exporting === user.id ? "Export..." : "RGPD"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((user) => {
              const editable = canEdit(user);
              const roleEditable = canChangeRole(user);

              return (
                <div
                  key={user.id}
                  className="rounded-xl border shadow-sm p-4 space-y-3"
                  style={{
                    background: "var(--sud-card)",
                    borderColor: "var(--sud-border)",
                    opacity: editable ? 1 : 0.7,
                  }}
                >
                  <div>
                    <p className="font-semibold" style={{ color: "var(--sud-black)" }}>
                      {user.full_name || "—"}
                    </p>
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

                  {editable && (
                    <div className="space-y-2 pt-2" style={{ borderTop: "1px solid var(--sud-border)" }}>
                      <div className="flex gap-2">
                        {roleEditable ? (
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                            className="flex-1 px-2 py-2 rounded-lg text-xs border"
                            style={{ background: "#FAFAFA", borderColor: "var(--sud-border)", color: "var(--sud-black)" }}
                          >
                            {availableRoles().map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex-1" />
                        )}
                        <select
                          value={user.site_id ?? ""}
                          onChange={(e) => updateUserSite(user.id, e.target.value || null)}
                          className="flex-1 px-2 py-2 rounded-lg text-xs border"
                          style={{ background: "#FAFAFA", borderColor: "var(--sud-border)", color: "var(--sud-black)" }}
                        >
                          <option value="">Aucun site</option>
                          {sites.map((site) => (
                            <option key={site.id} value={site.id}>{site.name}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => openEditModal(user)}
                        className="w-full text-xs px-3 py-2 rounded-lg border transition font-medium"
                        style={{ borderColor: "var(--sud-border)", color: "var(--sud-dark)" }}
                      >
                        Modifier (nom, email)
                      </button>

                      {isSuperAdmin && (
                        <button
                          onClick={() => handleExportUserData(user.id, user.email)}
                          disabled={exporting === user.id}
                          className="w-full text-xs px-3 py-2 rounded-lg border transition font-medium disabled:opacity-50"
                          style={{ borderColor: "#E60077", color: "#E60077" }}
                        >
                          {exporting === user.id ? "Export en cours..." : "Exporter les données (RGPD)"}
                        </button>
                      )}
                    </div>
                  )}

                  {!editable && (
                    <div className="pt-2 text-xs" style={{ borderTop: "1px solid var(--sud-border)", color: "var(--sud-muted)" }}>
                      Modification non autorisée
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Résultats filtrés */}
          {search && filtered.length === 0 && (
            <p className="text-center text-sm py-4" style={{ color: "var(--sud-muted)" }}>
              Aucun résultat pour &quot;{search}&quot;
            </p>
          )}
        </>
      )}

      {/* Modal d'édition */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !saving && setEditing(null)} />
          <div
            className="relative w-full max-w-md rounded-xl border shadow-lg p-6 space-y-4"
            style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
          >
            <h2 className="text-lg font-bold" style={{ color: "var(--sud-black)" }}>
              Modifier l&apos;utilisateur
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>
                  Nom complet
                </label>
                <input
                  type="text"
                  value={editing.full_name}
                  onChange={(e) => setEditing({ ...editing, full_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
                  style={{ background: "#FAFAFA", borderColor: "var(--sud-border)", color: "var(--sud-black)" }}
                  placeholder="Nom complet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={editing.email}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
                  style={{ background: "#FAFAFA", borderColor: "var(--sud-border)", color: "var(--sud-black)" }}
                  placeholder="adresse@email.com"
                />
                {editing.email !== users.find((u) => u.id === editing.id)?.email && (
                  <p className="text-xs mt-1" style={{ color: "#E60077" }}>
                    Un email de confirmation sera envoyé à la nouvelle adresse.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>
                  Site
                </label>
                <select
                  value={editing.site_id ?? ""}
                  onChange={(e) => setEditing({ ...editing, site_id: e.target.value || null })}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
                  style={{ background: "#FAFAFA", borderColor: "var(--sud-border)", color: "var(--sud-black)" }}
                >
                  <option value="">Aucun site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {editError && (
              <p className="text-sm p-3 rounded-lg" style={{ background: "var(--sud-pink-light)", color: "#E60077" }}>
                {editError}
              </p>
            )}

            {editSuccess && (
              <p className="text-sm p-3 rounded-lg" style={{ background: "var(--sud-yellow-soft)", color: "var(--sud-dark)" }}>
                {editSuccess}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition disabled:opacity-50"
                style={{ borderColor: "var(--sud-border)", color: "var(--sud-dark)" }}
              >
                {editSuccess ? "Fermer" : "Annuler"}
              </button>
              {!editSuccess && (
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition disabled:opacity-50"
                  style={{ background: "#E60077" }}
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
