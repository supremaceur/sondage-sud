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
      .select("id, role, email, full_name")
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

    // ── Changement d'email ──
    let emailChangeRequested = false;

    if (email && email !== targetProfile.email) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const resendApiKey = process.env.RESEND_API_KEY;

      if (!serviceRoleKey) {
        return NextResponse.json(
          { error: "Clé service_role non configurée." },
          { status: 500 }
        );
      }

      if (!resendApiKey) {
        return NextResponse.json(
          { error: "Clé Resend non configurée. Impossible d'envoyer l'email de confirmation." },
          { status: 500 }
        );
      }

      // Client admin Supabase
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Récupérer l'email Auth (peut différer de profiles.email)
      const { data: authUser, error: authUserError } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (authUserError || !authUser?.user?.email) {
        return NextResponse.json(
          { error: "Impossible de récupérer l'utilisateur Auth." },
          { status: 500 }
        );
      }

      const currentAuthEmail = authUser.user.email;

      // Générer le lien de confirmation (ne change PAS l'email immédiatement)
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "email_change_new",
          email: currentAuthEmail,
          newEmail: email,
          options: {
            redirectTo: `${request.headers.get("origin") || request.nextUrl.origin}/auth/callback`,
          },
        });

      if (linkError || !linkData) {
        return NextResponse.json(
          { error: `Erreur génération du lien : ${linkError?.message ?? "Lien non généré."}` },
          { status: 400 }
        );
      }

      const confirmationLink = linkData.properties?.action_link;

      if (!confirmationLink) {
        return NextResponse.json(
          { error: "Impossible de générer le lien de confirmation." },
          { status: 500 }
        );
      }

      // Envoyer l'email de confirmation via Resend
      const userName = targetProfile.full_name || targetProfile.email;
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "SUD P2ST <noreply@sudptt.ovh>",
          to: [email],
          subject: "Confirmez votre nouvelle adresse email — SUD P2ST",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #FFF9C4;">
                <h1 style="color: #E60077; margin: 0; font-size: 24px;">SUD P2ST</h1>
              </div>

              <div style="padding: 30px 0;">
                <p style="font-size: 16px; color: #333;">Bonjour <strong>${userName}</strong>,</p>

                <p style="font-size: 14px; color: #555; line-height: 1.6;">
                  Un administrateur a demandé le changement de votre adresse email sur la plateforme SUD P2ST.
                </p>

                <div style="background: #FFF9C4; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #333;">
                    <strong>Ancienne adresse :</strong> ${currentAuthEmail}<br/>
                    <strong>Nouvelle adresse :</strong> ${email}
                  </p>
                </div>

                <p style="font-size: 14px; color: #555; line-height: 1.6;">
                  Pour confirmer ce changement, cliquez sur le bouton ci-dessous :
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmationLink}"
                     style="background: #E60077; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                    Confirmer le changement d'email
                  </a>
                </div>

                <p style="font-size: 12px; color: #999; line-height: 1.5;">
                  Si vous n'avez pas demandé ce changement, ignorez cet email. Votre adresse email actuelle restera inchangée.
                </p>

                <p style="font-size: 12px; color: #999; line-height: 1.5;">
                  Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
                  <a href="${confirmationLink}" style="color: #E60077; word-break: break-all;">${confirmationLink}</a>
                </p>
              </div>

              <div style="border-top: 1px solid #eee; padding-top: 15px; text-align: center;">
                <p style="font-size: 11px; color: #999; margin: 0;">
                  SUD P2ST — Plateforme de sondages syndicaux
                </p>
              </div>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        const emailError = await emailRes.json().catch(() => null);
        console.error("Erreur Resend:", emailError);
        return NextResponse.json(
          { error: "Erreur lors de l'envoi de l'email de confirmation." },
          { status: 500 }
        );
      }

      emailChangeRequested = true;
    }

    return NextResponse.json({
      success: true,
      emailChangeRequested,
      message: emailChangeRequested
        ? "Profil mis à jour. Un email de confirmation a été envoyé à la nouvelle adresse."
        : "Profil mis à jour.",
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
