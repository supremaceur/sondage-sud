import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAGIC_LINK_EXPIRY_SECONDS = 300; // 5 minutes

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const type = searchParams.get("type"); // "magiclink" si magic link

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }

    // Si c'est un magic link, vérifier l'expiration côté serveur
    if (type === "magiclink") {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Récupérer le magic_link_sent_at depuis le profil
        const { data: profile } = await supabase
          .from("profiles")
          .select("magic_link_sent_at")
          .eq("id", user.id)
          .single();

        if (profile?.magic_link_sent_at) {
          const sentAt = new Date(profile.magic_link_sent_at).getTime();
          const now = Date.now();
          const elapsed = (now - sentAt) / 1000;

          if (elapsed > MAGIC_LINK_EXPIRY_SECONDS) {
            // Lien expiré → déconnecter et rediriger
            await supabase.auth.signOut();

            // Nettoyer le timestamp
            await supabase
              .from("profiles")
              .update({ magic_link_sent_at: null })
              .eq("id", user.id);

            return NextResponse.redirect(
              `${origin}/login?error=magic_link_expired`
            );
          }
        }

        // Lien valide → nettoyer le timestamp
        await supabase
          .from("profiles")
          .update({ magic_link_sent_at: null })
          .eq("id", user.id);
      }
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
