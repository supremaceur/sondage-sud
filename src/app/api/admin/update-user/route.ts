import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ── Vérifier l'authentification ──
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // ── Vérifier que le caller est admin ou super_admin ──
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, site_id")
      .eq("id", user.id)
      .single();

    const callerRole = callerProfile?.role;
    const isSuperAdmin = callerRole === "super_admin";
    const isAdmin = callerRole === "admin" || isSuperAdmin;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Accès refusé." },
        { status: 403 }
      );
    }

    // ── Lire les données de la requête ──
    const body = await request.json();
    const { userId, full_name, email, site_id } = body as {
      userId: string;
      full_name?: string;
      email?: string;
      site_id?: string | null;
    };

    if (!userId) {
      return NextResponse.json(
        { error: "Paramètre userId requis." },
        { status: 400 }
      );
    }

    // ── Récupérer l'utilisateur cible ──
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, role, email")
      .eq("id", userId)
      .single();

    if (!targetProfile) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    // ── Vérifier les permissions ──
    if (!isSuperAdmin) {
      // Admin classique : restrictions
      if (targetProfile.role === "super_admin" || targetProfile.role === "admin") {
        return NextResponse.json(
          { error: "Vous ne pouvez pas modifier un administrateur." },
          { status: 403 }
        );
      }
      if (targetProfile.id === user.id) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas modifier votre propre compte ici." },
          { status: 403 }
        );
      }
    }

    // ── Mettre à jour le profil (nom, site) ──
    const profileUpdate: Record<string, unknown> = {};

    if (full_name !== undefined) {
      profileUpdate.full_name = full_name.trim() || null;
    }

    if (site_id !== undefined) {
      profileUpdate.site_id = site_id || null;
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", userId);

      if (updateError) {
        return NextResponse.json(
          { error: "Erreur lors de la mise à jour du profil." },
          { status: 500 }
        );
      }
    }

    // ── Changement d'email via Supabase Admin API ──
    let emailChangeRequested = false;

    if (email && email !== targetProfile.email) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!serviceRoleKey) {
        return NextResponse.json(
          {
            error:
              "La clé service_role n'est pas configurée. Le changement d'email n'est pas disponible. Contactez l'administrateur système.",
          },
          { status: 500 }
        );
      }

      // Créer un client admin avec la clé service_role
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Mettre à jour l'email — Supabase enverra un email de confirmation
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email }
      );

      if (emailError) {
        return NextResponse.json(
          { error: `Erreur changement d'email : ${emailError.message}` },
          { status: 400 }
        );
      }

      emailChangeRequested = true;
    }

    return NextResponse.json({
      success: true,
      emailChangeRequested,
      message: emailChangeRequested
        ? "Profil mis à jour. Un email de confirmation a été envoyé pour valider le changement d'adresse."
        : "Profil mis à jour.",
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
