# CLAUDE.md — MaPyramide
> Ce fichier est le cerveau du projet. Claude Code le lit à chaque session.

---

## 🎯 Vision

**MaPyramide** — Application web progressive (PWA) de développement personnel.
6 domaines de vie, des défis de 3 minutes par jour, progression niveau par niveau.

**Tagline :** "Construis ta meilleure version, un niveau à la fois."

---

## 🛠️ Stack technique

| Outil | Version | Rôle |
|---|---|---|
| Next.js | 14 (App Router) | Framework frontend + SSR |
| TypeScript | 5.x | Typage statique |
| Tailwind CSS v4 | latest | Styling utility-first |
| Zustand | latest | État global + persistance localStorage |
| Supabase | latest | Auth (magic link) + PostgreSQL + RLS |
| Vercel | — | Déploiement |

---

## 📁 Structure des dossiers

```
mapyramide/
├── app/
│   ├── layout.tsx              # Root layout — polices Syne + DM Sans
│   ├── globals.css             # Design tokens CSS + Tailwind theme
│   ├── page.tsx                # Landing /
│   ├── auth/
│   │   └── page.tsx            # Authentification magic link
│   └── (app)/                  # Routes protégées — layout avec Header + BottomNav
│       ├── layout.tsx          # Shell 720px + nav
│       ├── page.tsx            # Dashboard — 6 domaines
│       ├── sante/page.tsx      # Domaine Santé (MVP détaillé)
│       ├── finances/page.tsx
│       ├── travail/page.tsx
│       ├── entrepreneuriat/page.tsx
│       ├── bienetre/page.tsx
│       └── ecologie/page.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # Logo + streak pill + avatar
│   │   └── BottomNav.tsx       # 4 onglets fixes
│   ├── ui/                     # Composants réutilisables
│   └── challenges/             # Cards, modales, métriques
├── lib/
│   └── supabase.ts             # Client Supabase
├── store/
│   └── app-store.ts            # Zustand store global
├── types/
│   └── index.ts                # Tous les types TypeScript
└── supabase/
    └── migrations/
        ├── 001_schema.sql      # Tables + RLS + trigger profil
        └── 002_seed.sql        # 6 domaines + 108 défis complets
```

---

## 🎨 Design System

### Palette globale
```css
--white:   #FFFFFF
--off:     #F7F6F3   /* fond principal */
--off2:    #EEECE8
--border:  #E0DDD6
--border2: #C8C5BC
--ink:     #1A1916   /* texte principal */
--ink2:    #6B6860   /* texte secondaire */
--ink3:    #A8A5A0   /* texte tertiaire */
```

### Couleurs domaines
| Domaine | color | bg | border |
|---|---|---|---|
| Santé | #2E7D0E | #EEF7E6 | #AAD8A0 |
| Finances | #B87A10 | #FFF8EC | #F5D48A |
| Travail | #1A5FA8 | #EEF4FF | #A8C8F5 |
| Entrepreneuriat | #B84020 | #FFF2EE | #F5B8A8 |
| Bien-être | #5E4DC4 | #F3F1FF | #C4BEF5 |
| Écologie | #0E7A58 | #EAFAF4 | #8ADAC4 |

### Typographie
- Titres, chiffres, badges : `font-family: Syne, font-weight: 700/800`
- Corps, labels, texte courant : `font-family: DM Sans, font-weight: 400/500`

### Composants clés
- Cards : `border-radius: 12px`, `border: 1px solid #E0DDD6`, shadow légère
- Promise cards : `border-radius: 14px`, états active/locked/done
- Bottom sheet : `border-radius: 22px 22px 0 0`, animation translateY 300ms
- Toast : `border-radius: 100px`, fond `#1A1916`, dismiss 3s
- Shell : `max-width: 720px`, centré, 1 col mobile → 2 col à 600px+

---

## 🗄️ Base de données Supabase

### Tables
- `profiles` — profil utilisateur (streak, last_active_date)
- `domains` — 6 domaines (seeded, lecture seule)
- `challenges` — 108 défis répartis sur 5 niveaux × 6 domaines (seeded)
- `challenge_completions` — complétions utilisateur (unique par user+challenge)
- `user_metrics` — historique métriques Santé (pas, hydra, repas, masse, seances)
- `user_domain_progress` — niveau courant par domaine

### Logique métier
- **Déverrouillage** : niveau N+1 accessible quand ≥ 75% des défis N complétés
- **Streak** : incrémente si ≥ 1 défi complété dans la journée calendaire
- **Santé** : si `is_measure: true` → saisie du chiffre obligatoire
- **Domaines basiques** : validation simple sans saisie de métrique

---

## 📱 Pages et navigation

### Bottom Nav
```
[Accueil] [Défi du jour] [Progression] [Profil]
```

### Routes
```
/                 Landing
/auth             Magic link email
/app              Dashboard — 6 domaines
/app/sante        Domaine Santé (MVP détaillé avec métriques)
/app/finances     Domaine Finances
/app/travail      Domaine Travail
/app/entrepreneuriat
/app/bienetre
/app/ecologie
/app/defi-du-jour Premier défi non complété du domaine actif
/app/progression  Statistiques (Phase 2)
/app/profil       Profil utilisateur
```

---

## 🔐 Configuration

Variables d'environnement dans `.env.local` (jamais committé) :
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

---

## 🔄 Ordre de développement

```
Phase 0 (actuel) — Initialisation
  ✅ Projet Next.js 14 créé
  ✅ Design system (CSS vars + Syne/DM Sans)
  ✅ Structure dossiers
  ✅ Migrations SQL + seed 108 défis
  ✅ Layout /app (Header + BottomNav + shell)
  ✅ Zustand store
  ✅ Supabase client

Phase 1 — Auth
  ☐ Magic link email (Supabase Auth)
  ☐ Middleware de protection des routes /app
  ☐ Création profil auto (trigger SQL déjà en place)

Phase 2 — Dashboard
  ☐ Charger 6 domaines depuis Supabase
  ☐ Afficher progression par domaine
  ☐ Défi du jour par domaine

Phase 3 — Domaine Santé (MVP complet)
  ☐ Hero vert + barre de progression
  ☐ Dashboard 5 métriques
  ☐ Challenge cards (fermée/ouverte/done)
  ☐ Bottom sheet avec saisie métrique
  ☐ Déverrouillage niveaux (75%)

Phase 4 — Domaines basiques
  ☐ Template commun pour les 5 domaines restants
  ☐ Validation simple sans métrique

Phase 5 — Polish
  ☐ Toast notifications
  ☐ Streak logic
  ☐ PWA manifest + service worker
  ☐ Déploiement Vercel
```

---

## 📏 Règles de code

1. **Pas de logique dans les composants** — appeler le store Zustand ou des hooks dédiés
2. **Types stricts** — tout est typé depuis `types/index.ts`
3. **Commentaires en français** — chaque fonction/composant a une ligne d'explication
4. **Design system** — utiliser les variables CSS, jamais de couleurs hardcodées
5. **Mobile first** — toujours tester sur 375px avant 720px+
6. **Un fichier = une responsabilité** — composants < 200 lignes

---

*Dernière mise à jour : 2026-03-23*
*Projet : MaPyramide — PWA développement personnel*
