# CLAUDE.md — MaPyramide
> Ce fichier est le cerveau du projet. Claude Code le lit à chaque session.
> Ne pas supprimer. Mettre à jour au fil des évolutions du projet.

---

## 🎯 Vision du projet

**MaPyramide** est une PWA de développement personnel structurée en 6 domaines de vie.
L'utilisateur progresse niveau par niveau via des défis, mesure ses métriques clés et planifie ses habitudes dans un calendrier.

**Promesse utilisateur :** "Un seul endroit pour construire la meilleure version de toi-même."

**Boucle principale :**
```
Découvrir un défi → Le compléter → Mesurer sa progression → Planifier dans le calendrier
```

---

## ✅ Avancement MVP

### Features implémentées
- [x] Authentification email + mot de passe (pas de magic link)
- [x] Onboarding 6 étapes (questionnaire + insights habitudes + domaines)
- [x] Page d'accueil `/` → redirection intelligente (onboarding / auth)
- [x] Dashboard Objectifs — métriques par domaine avec onglets filtrants + bannière intro
- [x] Pages domaines `/app/[slug]` — défis par niveau, complétion, métriques
- [x] Calendrier hebdomadaire — WeekStrip, EventCards, AddEventSheet, récurrence
- [x] Onboarding calendrier — bottom sheet 4 slides au 1er accès + bouton ?
- [x] Page Profil — identité, déconnexion, suppression de compte (2 étapes), dev tools
- [x] Mode CLAUDE_DEBUG — toggle dans Profil, annotation par défi dans CompleteSheet
- [x] `scheduling_type` sur chaque défi (null / one_time / recurring)
- [x] Table `challenge_notes` — commentaires admin par défi

### Features exclues (Phase 2 ou plus)
- ❌ Notifications push (service worker, VAPID)
- ❌ Mode hors-ligne complet (SW + cache réseau)
- ❌ Statistiques avancées / graphs
- ❌ Partage social / mode équipe
- ❌ Animations & transitions entre écrans

---

## 🛠️ Stack technique

| Outil | Version | Rôle |
|---|---|---|
| Next.js | 14 (App Router) | Framework PWA |
| TypeScript | 5.x | Langage |
| Tailwind CSS | v4 | Styles utilitaires |
| Zustand | ^5 | État global (persist) |
| Supabase | ^2 | Backend, auth, BDD |

### Variables d'environnement
```
NEXT_PUBLIC_SUPABASE_URL=https://vwoygzzgqsusuvvkzmsz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Lancer le dev server
```bash
npm run dev   # port 3000
```

---

## 📁 Structure des dossiers

```
MaPyramide/
├── app/
│   ├── page.tsx                        # Racine → redirect onboarding ou auth
│   ├── onboarding/page.tsx             # Onboarding 6 étapes (questionnaire)
│   ├── auth/
│   │   ├── page.tsx                    # Login-first, signup inline, confirmation email
│   │   └── callback/route.ts           # Callback Supabase auth
│   └── app/
│       ├── layout.tsx                  # Shell avec BottomNav + AppInitializer
│       ├── page.tsx                    # Objectifs — métriques par domaine
│       ├── defis/page.tsx              # Liste des défis tous domaines
│       ├── calendrier/page.tsx         # Calendrier hebdomadaire
│       ├── profil/page.tsx             # Profil, déconnexion, suppression compte, dev tools
│       ├── [slug]/page.tsx             # Page domaine — défis par niveau
│       └── [domaine]/[...]             # Pages domaines spécifiques
├── components/
│   ├── layout/
│   │   ├── AppInitializer.tsx          # Charge profil + streak au boot
│   │   └── BottomNav.tsx              # Navigation bas (4 onglets)
│   ├── domain/
│   │   └── CompleteSheet.tsx           # Bottom sheet complétion défi + CLAUDE_DEBUG
│   ├── calendar/
│   │   └── CalendarOnboarding.tsx      # Onboarding calendrier (bottom sheet 4 slides)
│   ├── objectifs/
│   │   └── MetricCard.tsx              # Carte métrique (dashboard objectifs)
│   └── ui/                            # Design system : Btn, PyramidIcon, etc.
├── lib/
│   ├── tokens.ts                       # Design tokens (couleurs, shadows, radii, fonts)
│   ├── supabase.ts                     # Client Supabase partagé
│   ├── metrics-config.ts               # Config métriques par domaine (DOMAIN_METRICS)
│   └── hooks/
│       ├── useMetrics.ts               # Charge les métriques user
│       ├── useDashboard.ts             # Charge domaines + progression
│       ├── useDomain.ts                # Charge défis + complétion + completeChallenge()
│       └── useCalendar.ts              # Charge et gère les événements calendrier
├── store/
│   └── app-store.ts                    # Zustand store (profile, domains, completions…)
├── types/
│   └── index.ts                        # Tous les types TypeScript (Domain, Challenge, Profile…)
└── supabase/
    └── migrations/                     # Scripts SQL à exécuter dans Supabase SQL Editor
        ├── 001_schema.sql              # Tables : profiles, domains, challenges, completions, metrics, progress
        ├── 002_seed.sql                # Seed : 6 domaines + ~100 défis (tous domaines)
        ├── 003_rls_public_tables.sql   # RLS sur tables publiques (domains, challenges)
        ├── 004_challenges_update.sql   # Mise à jour structure défis
        ├── 005_calendar.sql            # Table calendar_events + RLS
        ├── 006_challenge_scheduling.sql # Colonne scheduling_type sur challenges
        ├── 007_scheduling_debug.sql    # UPDATE scheduling_type sur tous les défis + table challenge_notes
        └── 008_delete_user_rpc.sql     # Fonction RPC delete_user_account() (SECURITY DEFINER)
```

---

## 🗄️ Modèle de données Supabase

### Tables principales

| Table | Description | RLS |
|---|---|---|
| `profiles` | Profil étendu (email, streak_count, last_active_date) — auto-créé via trigger | ✅ owner only |
| `domains` | 6 domaines (slug, label, couleurs, icône) — données statiques | ❌ public read |
| `challenges` | ~100 défis par domaine/niveau avec scheduling_type | ❌ public read |
| `challenge_completions` | Complétions utilisateur (1 par user+défi) | ✅ owner only |
| `user_metrics` | Historique des valeurs de métriques | ✅ owner only |
| `user_domain_progress` | Niveau actuel par domaine par user | ✅ owner only |
| `calendar_events` | Événements calendrier (ponctuels + récurrents) | ✅ owner only |
| `challenge_notes` | Notes admin par défi (CLAUDE_DEBUG) | ✅ owner only |

### Colonne `scheduling_type` sur `challenges`
```
null        → défi de mesure/réflexion, pas de calendrier
"one_time"  → rendez-vous unique à planifier (ex: ouvrir un PEA)
"recurring" → habitude récurrente (ex: 30 min de sport)
```

### Fonction RPC `delete_user_account()`
Supprime toutes les données user + entrée auth.users (SECURITY DEFINER, réservée aux `authenticated`).

---

## 🎨 Design System

### Palette — `lib/tokens.ts`
```ts
primary       = '#6C63FF'   // violet principal
primaryLight  = '#F0EEFF'   // fond violet très léger
bg            = '#FAFAFA'   // fond global blanc cassé
surface       = '#FFFFFF'   // cartes blanc pur
border        = '#F0F0F5'   // bordures très légères
text1         = '#1A1A2E'   // texte principal quasi-noir
text2         = '#6B6B8A'   // texte secondaire
text3         = '#A0A0B8'   // texte tertiaire / labels
success       = '#2E7D32'
successLight  = '#EDFAF4'
danger        = '#D32F2F'
dangerLight   = '#FFF0F0'
```

### Principes
- Thème clair — inspiré N26 / Revolut Light
- Cartes : `background: surface`, `border: 1.5px solid border`, `borderRadius: 20px`, ombre douce
- Une seule action principale par écran
- Hiérarchie typographique : 22px bold / 17px semibold / 15px regular / 13px secondaire / 11px uppercase labels
- Pas de surcharge — beaucoup d'espace blanc

---

## 🔑 localStorage keys

| Clé | Valeur | Usage |
|---|---|---|
| `mp_onboarding_done` | `"true"` | Empêche de revoir l'onboarding |
| `mp_cal_welcome_done` | `"true"` | Empêche de revoir l'onboarding calendrier |
| `mp_debug_mode` | `"true"` / `"false"` | Active le mode CLAUDE_DEBUG |
| `mp_redirect_defis` | `"true"` | Redirige vers /app/defis après le 1er login (posé en fin d'onboarding) |

---

## 🔐 Flux d'authentification

```
/ (root)
  ├─ mp_onboarding_done = false → /onboarding
  │     ↓ "Créer mon compte 🚀" → pose mp_redirect_defis + push /auth
  │     ↓ "Passer l'onboarding" → push /auth (sans mp_redirect_defis)
  └─ mp_onboarding_done = true  → /auth

/auth
  ├─ Vue Login (défaut)
  │     ↓ succès → lit mp_redirect_defis → /app/defis ou /app
  ├─ Vue Signup → formulaire → email de confirmation envoyé
  └─ Vue Confirmation → bouton retour login (email pré-rempli)
```

---

## 📱 Navigation

```
BottomNav : [🎯 Objectifs] [🏆 Défis] [📅 Calendrier] [👤 Profil]
Routes     :  /app           /app/defis  /app/calendrier  /app/profil
```

---

## 📋 Règles de code

1. **Un fichier = une responsabilité** — screen → UI seulement, logique dans hooks/store
2. **Commentaires en français** — chaque fonction a une ligne d'explication
3. **Pas de Supabase dans les composants** — passer par les hooks (`useDomain`, `useCalendar`…)
4. **Design tokens toujours** — jamais de couleurs hardcodées, toujours `colors.xxx`
5. **TypeScript strict** — pas de `any`, types dans `types/index.ts`
6. **Jamais committer `.env.local`** — credentials Supabase hors Git

---

## 📝 Journal des décisions

| Date | Décision | Raison |
|---|---|---|
| 2026-03 | PWA Next.js 14 | Un seul codebase web/mobile, déploiement Vercel simple |
| 2026-03 | Supabase | Backend managé, auth intégrée, RLS, pas de serveur custom |
| 2026-03 | Zustand persist | État local léger avec persistance localStorage |
| 2026-03 | Pas de magic link | Email+password plus fiable pour un public non-tech |
| 2026-03 | Thème clair | Plus reposant, inspiré banking (N26/Revolut light) |
| 2026-03 | scheduling_type null/one_time/recurring | Contextualiser le bouton "Planifier" selon le type de défi |
| 2026-03 | CLAUDE_DEBUG via toggle Profil | Plus accessible que la console, section cachée par défaut (tap ×5 sur version) |
| 2026-03 | Auth login-first sans tabs | UX plus claire, inscription secondaire, flux confirmation email |
| 2026-03 | Suppression compte 2 étapes + countdown | Évite les taps accidentels sans friction excessive |
| 2026-03 | Onboarding → redirect défis | Amener le nouvel user directement vers l'action |

---

## 🔄 Ordre des migrations Supabase

À exécuter dans l'ordre dans le SQL Editor (projet **recette**) :

```
001_schema.sql              ← tables de base + trigger profil
002_seed.sql                ← 6 domaines + ~100 défis
003_rls_public_tables.sql   ← RLS domains + challenges
004_challenges_update.sql   ← évolutions structure défis
005_calendar.sql            ← calendrier
006_challenge_scheduling.sql ← colonne scheduling_type
007_scheduling_debug.sql    ← UPDATE scheduling_type + table challenge_notes
008_delete_user_rpc.sql     ← fonction RPC suppression compte
```

---

*Dernière mise à jour : 2026-03-26*
*Projet : MaPyramide — Application de développement personnel*
