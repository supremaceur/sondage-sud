import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

// Routes protégées : nécessitent une connexion
const protectedRoutes = ["/surveys", "/admin", "/complete-profile"];
// Routes admin uniquement
const adminRoutes = ["/admin"];
// Routes super_admin uniquement (aucune pour le moment — les restrictions sont gérées côté page)
const superAdminRoutes: string[] = [];

export async function middleware(request: NextRequest) {
  // Rafraîchit la session
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Vérifie si la route est protégée
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route));

  if (!isProtected) return response;

  // Crée un client Supabase pour vérifier l'utilisateur
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirige vers login si non connecté
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Récupérer le profil (rôle + site)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, site_id")
    .eq("id", user.id)
    .single();

  // Forcer la complétion du profil (site obligatoire) sauf pour les super_admins
  const isCompleteProfile = pathname === "/complete-profile";
  if (
    profile &&
    !profile.site_id &&
    profile.role !== "super_admin" &&
    !isCompleteProfile
  ) {
    return NextResponse.redirect(new URL("/complete-profile", request.url));
  }

  // Ne pas bloquer sur /complete-profile si le profil est complet
  if (isCompleteProfile && profile?.site_id) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Vérifie le rôle admin
  if (isAdmin) {
    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Vérifie le rôle super_admin pour les routes dédiées
    const isSuperAdminRoute = superAdminRoutes.some((route) => pathname.startsWith(route));
    if (isSuperAdminRoute && profile.role !== "super_admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
