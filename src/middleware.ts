import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

// Routes protégées : nécessitent une connexion
const protectedRoutes = ["/surveys", "/admin", "/complete-profile"];
// Routes admin uniquement
const adminRoutes = ["/admin"];
// Routes super_admin uniquement (aucune pour le moment — les restrictions sont gérées côté page)
const superAdminRoutes: string[] = [];
// Routes publiques exclues de la vérification du site
const publicRoutes = ["/login", "/signup", "/forgot-password", "/auth", "/mentions-legales", "/api"];

export async function middleware(request: NextRequest) {
  // Rafraîchit la session
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route));
  const isCompleteProfile = pathname === "/complete-profile";

  // Routes publiques : pas de vérification
  if (isPublic) return response;

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

  // Routes protégées : redirige vers login si non connecté
  if (!user && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si l'utilisateur est connecté, vérifier la complétion du profil
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, site_id")
      .eq("id", user.id)
      .single();

    // Forcer la complétion du profil (site obligatoire) sauf super_admins
    if (
      profile &&
      !profile.site_id &&
      profile.role !== "super_admin" &&
      !isCompleteProfile
    ) {
      return NextResponse.redirect(new URL("/complete-profile", request.url));
    }

    // Si profil complet, ne pas rester sur /complete-profile
    if (isCompleteProfile && profile?.site_id) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Vérifie le rôle admin
    if (isAdmin) {
      if (!profile || !["admin", "super_admin"].includes(profile.role)) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      const isSuperAdminRoute = superAdminRoutes.some((route) => pathname.startsWith(route));
      if (isSuperAdminRoute && profile.role !== "super_admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
