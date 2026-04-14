# Sondage SUD P2ST — Contexte projet

## Description
Application web de sondages multi-sites pour le syndicat SUD P2ST. Permet de créer, diffuser et analyser des sondages par site géographique.

## Stack technique
- **Frontend** : Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **Backend / Auth / DB** : Supabase (PostgreSQL, Auth, RLS)
- **Graphiques** : Recharts (barres, camembert)
- **Export** : xlsx (étape 7 — à implémenter)

## Identité visuelle
- Palette SUD P2ST : `#E60077` (rose), `#FFF59D` (jaune pastel), `#222222` (noir)
- Design premium dark mode (fond `#0a0a0a`, cartes `#1e1e1e`, bordures `#2a2a2a`)
- Variables CSS définies dans `src/app/globals.css`

## Supabase
- **Project ref** : `rgiqbxtbxczwrscpbrfx`
- **URL** : `https://rgiqbxtbxczwrscpbrfx.supabase.co`
- Les clés sont dans `.env.local`

## Architecture multi-sites

### Sites disponibles
Blois, Clermont, La Rochelle, Nancy, Pau, Romanville, Rouen, Saint-Etienne, Siege, Tarbes, Troyes, Wasquehal

### Rôles
| Rôle | Droits |
|------|--------|
| `user` | Voir/répondre aux sondages de son site |
| `admin` | Créer/gérer les sondages de son site + voir les résultats |
| `super_admin` | Accès à tous les sites, gestion des utilisateurs et rôles |

### Règles métier
- Chaque utilisateur appartient à UN site (sauf super_admin qui peut avoir `site_id = null` = tous)
- Les admins créent des sondages pour leur site uniquement
- Les utilisateurs ne voient que les sondages de leur site
- Les résultats sont filtrés par site via RLS
- Le super_admin peut attribuer site + rôle à n'importe quel utilisateur

## Base de données

### Tables
| Table | Description |
|-------|-------------|
| `sites` | Liste des 12 sites (id UUID, name TEXT) |
| `profiles` | Profils utilisateurs liés à `auth.users` (id, email, full_name, role, site_id) |
| `surveys` | Sondages (id, title, description, is_active, created_by, site_id) |
| `questions` | Questions par sondage (id, survey_id, type, title, options JSONB, position) |
| `responses` | Réponses par utilisateur (id, survey_id, user_id) — UNIQUE(survey_id, user_id) |
| `answers` | Réponses individuelles (id, response_id, question_id, value JSONB) |

### Types de questions (enum `question_type`)
- `mcq_single` — QCM choix unique
- `mcq_multiple` — QCM choix multiple
- `counter` — Note/compteur 0-10
- `free_text` — Texte libre

### Sécurité RLS
- Toutes les tables ont RLS activé
- Filtrage par `site_id` pour les sondages
- Utilisateurs ne voient que leurs propres réponses
- Admins voient toutes les réponses de leur site
- Super_admin bypass le filtre site
- Trigger `handle_new_user()` crée automatiquement un profil à l'inscription

## Structure des fichiers

```
src/
├── app/
│   ├── layout.tsx              # Layout principal (AuthProvider + Header)
│   ├── page.tsx                # Page d'accueil
│   ├── globals.css             # Variables CSS SUD P2ST
│   ├── login/page.tsx          # Connexion
│   ├── signup/page.tsx         # Inscription (avec sélecteur de site)
│   ├── auth/callback/route.ts  # Callback OAuth
│   ├── surveys/
│   │   ├── page.tsx            # Liste sondages (filtrés par site)
│   │   └── [id]/page.tsx       # Répondre à un sondage
│   └── admin/
│       ├── page.tsx            # Dashboard admin (liste sondages)
│       ├── create/page.tsx     # Créer un sondage
│       ├── results/[id]/page.tsx # Résultats + graphiques
│       └── users/page.tsx      # Gestion utilisateurs (super_admin)
├── components/
│   ├── AuthProvider.tsx        # Contexte auth global (user, profile, role, site)
│   ├── Header.tsx              # Navigation (adaptatif selon rôle)
│   ├── QuestionForm.tsx        # Formulaire de question (création sondage)
│   ├── SiteSelect.tsx          # Sélecteur de site réutilisable
│   └── charts/
│       ├── McqChart.tsx        # Graphiques barres + camembert (QCM)
│       └── CounterChart.tsx    # Graphique barres + moyenne (compteur)
├── lib/supabase/
│   ├── client.ts               # Client navigateur
│   ├── server.ts               # Client serveur (SSR)
│   └── middleware.ts           # Gestion session cookies
├── middleware.ts               # Protection des routes (auth + rôles)
└── types/
    └── index.ts                # Types TypeScript (Profile, Survey, Question, etc.)
```

## Routes protégées (middleware)
| Route | Accès |
|-------|-------|
| `/surveys/*` | Connecté |
| `/admin/*` | Admin ou Super_admin |
| `/admin/users` | Super_admin uniquement |

## Avancement des étapes
1. Architecture & base du projet — DONE
2. Authentification & rôles — DONE
3. Base de données — DONE
4. Création de sondages (admin) — DONE
5. Répondre aux sondages — DONE
6. Résultats & visualisation — DONE
7. Export Excel — TODO
8. Design UI — PARTIELLEMENT FAIT (palette SUD P2ST appliquée, dark mode premium)

## Compte super_admin
- Nom : Kévin Gouche
- Email : kevin.gouche@gmail.com
- Rôle : super_admin (à définir via SQL après inscription)
