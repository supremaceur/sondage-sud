# SUD P2ST — Plateforme de sondages syndicaux

Application web de sondages pour le syndicat SUD P2ST, permettant la gestion multi-sites, l'analyse des résultats et l'export professionnel.

**URL** : [sudptt.ovh](https://sudptt.ovh)

## Stack technique

- **Framework** : Next.js 16 (App Router, Turbopack)
- **Base de données** : Supabase (PostgreSQL, Auth, RLS)
- **Styles** : Tailwind CSS
- **Graphiques** : Recharts
- **Export Excel** : exceljs + file-saver
- **Email** : Resend (SMTP sortant)
- **Déploiement** : Vercel + domaine OVH (sudptt.ovh)

## Fonctionnalités

### Authentification
- Connexion par mot de passe
- Connexion par lien magique (expiration 5 min, vérification serveur)
- Inscription avec sélection du site
- Réinitialisation de mot de passe
- Callback Auth avec gestion des erreurs

### Sondages
- Création de sondages multi-questions
- Types de questions : QCM (choix unique/multiple), compteur, texte libre
- Attribution par site ou tous sites
- Activation/désactivation des sondages
- Participation unique par utilisateur

### Administration
- **Tableau de bord** : liste des sondages avec statut, nombre de réponses, actions
- **Résultats** : graphiques interactifs (barres, camemberts), analyse de sentiment, nuage de mots
- **Export Excel** : fichier professionnel multi-feuilles (résumé + une feuille par question)
- **Participants** : liste des participants par sondage avec suppression de participation
- **Gestion utilisateurs** : modification des profils, changement de site, édition nom/email

### Rôles et permissions

| Fonctionnalité | Utilisateur | Admin | Super Admin |
|---|:---:|:---:|:---:|
| Participer aux sondages | X | X | X |
| Voir les résultats | | X (son site) | X (tous) |
| Créer/modifier des sondages | | X | X |
| Exporter les résultats (Excel) | | X (son site) | X (tous) |
| Gérer les participants | | X (son site) | X (tous) |
| Voir les utilisateurs | | X | X |
| Modifier un utilisateur simple | | X | X |
| Modifier un admin/super admin | | | X |
| Changer les rôles | | | X |
| Export RGPD (Excel) | | | X |

### RGPD
- Export des données personnelles (Article 20 — droit à la portabilité)
- Fichier Excel structuré : Résumé, Informations utilisateur, Participations, Réponses détaillées
- Mentions légales complètes
- Changement d'email avec confirmation par l'utilisateur

### Responsive
- Design adaptatif mobile/desktop
- Menu hamburger avec overlay (mobile)
- Tables desktop + cartes mobile sur toutes les pages admin

## Structure du projet

```
src/
  app/
    page.tsx                          # Page d'accueil
    layout.tsx                        # Layout principal + footer
    login/page.tsx                    # Connexion (mot de passe + magic link)
    signup/page.tsx                   # Inscription
    forgot-password/page.tsx          # Mot de passe oublié
    mentions-legales/page.tsx         # Mentions légales RGPD
    auth/
      callback/route.ts              # Callback Auth (magic link, reset password)
      reset-password/page.tsx         # Réinitialisation mot de passe
    surveys/
      page.tsx                        # Liste des sondages disponibles
      [id]/page.tsx                   # Participation à un sondage
    admin/
      page.tsx                        # Tableau de bord admin
      create/page.tsx                 # Création de sondage
      edit/[id]/page.tsx              # Modification de sondage
      results/[id]/page.tsx           # Résultats + export Excel
      participants/[id]/page.tsx      # Participants d'un sondage
      users/page.tsx                  # Gestion des utilisateurs
    api/
      magic-link/route.ts            # Envoi magic link (POST)
      admin/
        update-user/route.ts          # Modification profil utilisateur (POST)
        confirm-email/route.ts        # Confirmation changement email (GET)
        delete-participation/route.ts # Suppression participation (POST)
      rgpd/
        export/route.ts              # Export RGPD Excel (GET)
  components/
    AuthProvider.tsx                  # Contexte d'authentification
    Header.tsx                        # Navigation + menu mobile
    SiteSelect.tsx                    # Sélecteur de site
    MultiSiteSelect.tsx               # Sélecteur multi-sites
    QuestionForm.tsx                  # Formulaire de question
    charts/
      McqChart.tsx                    # Graphique QCM (barres/camembert)
      CounterChart.tsx                # Graphique compteur
      SentimentBar.tsx                # Barre de sentiment
      WordCloud.tsx                   # Nuage de mots
  lib/
    analytics.ts                      # Analyse des résultats
    export.ts                         # Génération Excel (résultats)
    supabase/
      client.ts                       # Client Supabase (navigateur)
      server.ts                       # Client Supabase (serveur)
      middleware.ts                   # Middleware Auth
  types/
    index.ts                          # Types TypeScript (Profile, Survey, Question, etc.)
  middleware.ts                       # Middleware Next.js (protection des routes)
```

## Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=           # URL du projet Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Clé publique Supabase
SUPABASE_SERVICE_ROLE_KEY=          # Clé service_role (serveur uniquement)
RESEND_API_KEY=                     # Clé API Resend (envoi d'emails)
```

## Installation

```bash
npm install
npm run dev
```

## Base de données (Supabase)

### Tables
- **profiles** : id, email, full_name, role, site_id, magic_link_sent_at, created_at, updated_at
- **sites** : id, name, created_at
- **surveys** : id, created_by, title, description, is_active, site_id, created_at
- **questions** : id, survey_id, type, title, options, position, created_at
- **responses** : id, survey_id, user_id, submitted_at
- **answers** : id, response_id, question_id, value, created_at

### Fonctions SQL
- `update_magic_link_sent_at(user_email text)` : SECURITY DEFINER, met à jour le timestamp du magic link

## Sécurité
- RLS (Row Level Security) activé sur toutes les tables
- Routes API protégées côté serveur (vérification rôle)
- Clé service_role jamais exposée côté client (pas de préfixe NEXT_PUBLIC_)
- Tokens signés HMAC-SHA256 pour la confirmation de changement d'email
- Middleware Next.js pour la protection des routes admin
