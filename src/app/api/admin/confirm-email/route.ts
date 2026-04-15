import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

/** Vérifie et décode le token signé */
function verifyEmailChangeToken(
  token: string,
  secret: string
): { userId: string; newEmail: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [data, signature] = parts;

  // Vérifier la signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  if (signature !== expectedSignature) return null;

  // Décoder le payload
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());

    // Vérifier l'expiration
    if (!payload.exp || Date.now() > payload.exp) return null;
    if (!payload.userId || !payload.newEmail) return null;

    return { userId: payload.userId, newEmail: payload.newEmail };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");
  const origin = request.headers.get("origin") || request.nextUrl.origin;

  if (!token) {
    return createHtmlResponse(origin, false, "Lien invalide.");
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return createHtmlResponse(origin, false, "Erreur de configuration serveur.");
  }

  // Vérifier le token
  const payload = verifyEmailChangeToken(token, serviceRoleKey);
  if (!payload) {
    return createHtmlResponse(origin, false, "Ce lien est invalide ou a expiré.");
  }

  const { userId, newEmail } = payload;

  // Client admin Supabase
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. Mettre à jour l'email dans Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { email: newEmail, email_confirm: true }
  );

  if (authError) {
    console.error("Erreur Auth updateUserById:", authError);
    return createHtmlResponse(
      origin,
      false,
      `Erreur lors du changement d'email : ${authError.message}`
    );
  }

  // 2. Mettre à jour l'email dans la table profiles
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ email: newEmail })
    .eq("id", userId);

  if (profileError) {
    console.error("Erreur profiles update:", profileError);
    // L'email Auth est déjà changé, on continue quand même
  }

  return createHtmlResponse(origin, true, newEmail);
}

/** Génère une page HTML de résultat */
function createHtmlResponse(origin: string, success: boolean, detail: string) {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? "Email confirmé" : "Erreur"} — SUD P2ST</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #F5F5F5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: white; border-radius: 16px; padding: 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.08); border: 1px solid #E5E5E5; }
    .icon { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
    .icon-success { background: #E8F5E9; }
    .icon-error { background: #FCE4EC; }
    h1 { font-size: 22px; color: #333; margin-bottom: 12px; }
    p { font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 8px; }
    .email { font-weight: bold; color: #E60077; }
    .btn { display: inline-block; margin-top: 24px; padding: 12px 32px; background: #E60077; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; }
    .brand { margin-top: 30px; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="card">
    ${
      success
        ? `
      <div class="icon icon-success">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h1>Adresse email confirmée</h1>
      <p>Votre adresse email a été changée avec succès.</p>
      <p>Nouvelle adresse : <span class="email">${detail}</span></p>
      <p style="font-size: 13px; color: #999; margin-top: 8px;">Utilisez cette adresse pour vos prochaines connexions.</p>
      <a href="${origin}/login" class="btn">Se connecter</a>
    `
        : `
      <div class="icon icon-error">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E60077" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h1>Erreur</h1>
      <p>${detail}</p>
      <a href="${origin}" class="btn">Retour au site</a>
    `
    }
    <p class="brand">SUD P2ST — Plateforme de sondages syndicaux</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: success ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
