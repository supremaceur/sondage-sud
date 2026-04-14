import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email requis." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const origin = request.headers.get("origin") || request.nextUrl.origin;

    // 1. Enregistrer le timestamp d'envoi côté serveur (AVANT l'envoi)
    // Utiliser la fonction SECURITY DEFINER pour mettre à jour le profil
    await supabase.rpc("update_magic_link_sent_at", { user_email: email });

    // 2. Envoyer le magic link via Supabase Auth
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?type=magiclink`,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
