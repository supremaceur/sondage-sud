import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // Vérifier que le caller est admin ou super_admin
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!callerProfile || !["admin", "super_admin"].includes(callerProfile.role)) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const { responseId } = (await request.json()) as { responseId: string };

    if (!responseId) {
      return NextResponse.json(
        { error: "Paramètre responseId requis." },
        { status: 400 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Configuration serveur manquante." },
        { status: 500 }
      );
    }

    // Client admin pour contourner les RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Supprimer les réponses (answers) puis la participation (response)
    const { error: answersError } = await supabaseAdmin
      .from("answers")
      .delete()
      .eq("response_id", responseId);

    if (answersError) {
      console.error("Erreur suppression answers:", answersError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression des réponses." },
        { status: 500 }
      );
    }

    const { error: responseError } = await supabaseAdmin
      .from("responses")
      .delete()
      .eq("id", responseId);

    if (responseError) {
      console.error("Erreur suppression response:", responseError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression de la participation." },
        { status: 500 }
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
