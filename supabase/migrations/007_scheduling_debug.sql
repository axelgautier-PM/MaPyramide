-- Migration 007 — scheduling_type par défi + table challenge_notes (CLAUDE_DEBUG)
-- ─────────────────────────────────────────────────────────────────────────────
-- Partie A : Propositions scheduling_type pour chaque défi
--   null       → pas de planification calendrier suggérée (mesure, réflexion, audit)
--   'one_time' → rendez-vous unique à bloquer (bilan médecin, ouverture PEA, etc.)
--   'recurring'→ séances régulières à inscrire en routine (sport, méditation, etc.)
-- ─────────────────────────────────────────────────────────────────────────────

-- ╔══════════════════════════════════════════════════════════╗
-- ║  DOMAINE : SANTÉ                                         ║
-- ╚══════════════════════════════════════════════════════════╝

-- Niveau 0 — Mesures baseline → pas de planification (on mesure, on n'agit pas encore)
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 0;

-- Niveau 1 — Premières actions
-- L1/0 "10 min de marche maintenant" → routine marche à ancrer
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 1 and order_index = 0;

-- L1/1 "La bouteille visible" → rappel hydratation quotidien
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 1 and order_index = 1;

-- L1/2 "Construis ton assiette équilibrée ce soir" → action cuisine unique, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 1 and order_index = 2;

-- L1/3 "Ta première séance de sport — 20 min" → routine sport à récurrence
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 1 and order_index = 3;

-- L1/4 "Note tes pas 7 jours de suite" → tracking, pas de créneau calendrier
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 1 and order_index = 4;

-- Niveau 2
-- L2/0 "Programme 3 séances dans ton calendrier" → cœur de la routine sport
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 2 and order_index = 0;

-- L2/1 "La règle des 2 jours" → règle mentale, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 2 and order_index = 1;

-- L2/2 "Protéines au petit-déjeuner" → routine matinale quotidienne
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 2 and order_index = 2;

-- L2/3 "Objectif 6 000 pas aujourd'hui" → routine pas journaliers
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 2 and order_index = 3;

-- L2/4 "Remplace 1 aliment ultra-transformé" → décision cognitive, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 2 and order_index = 4;

-- L2/5 "Bilan 21 jours" → comparaison ponctuelle
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 2 and order_index = 5;

-- Niveau 3
-- L3/0 "Surcharge progressive" → séances sport récurrentes
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 3 and order_index = 0;

-- L3/1 "Hydratation sur 5 jours" → tracking récurrent 5 jours
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 3 and order_index = 1;

-- L3/2 "Décrypte tes macronutriments — 1 journée" → mesure ponctuelle
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 3 and order_index = 2;

-- L3/3 "Sommeil et récupération" → observation 3 jours, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 3 and order_index = 3;

-- L3/4 "Photos et tour de taille" → mesure ponctuelle
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 3 and order_index = 4;

-- Niveau 4
-- L4/0 "Pourquoi profond" → réflexion, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 4 and order_index = 0;

-- L4/1 "Programme personnel — 4 semaines" → plan récurrent de sport
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 4 and order_index = 1;

-- L4/2 "Bilan trimestriel" → bilan ponctuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 4 and order_index = 2;

-- L4/3 "Défi sportif 12 mois" → projection, pas de RDV immédiat
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'sante')
    and level_index = 4 and order_index = 3;


-- ╔══════════════════════════════════════════════════════════╗
-- ║  DOMAINE : FINANCES                                      ║
-- ╚══════════════════════════════════════════════════════════╝

-- Niveau 0 — Mesures baseline → null
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 0;

-- Niveau 1 — Audits et diagnostics → null (on analyse, on ne planifie pas encore)
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 1;

-- Niveau 2
-- L2/0 "Se payer en premier — programme le virement automatique" → RDV unique pour configurer
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 2 and order_index = 0;

-- L2/1 "Supprime 3 abonnements inutiles" → action unique, pas de récurrence
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 2 and order_index = 1;

-- L2/2 "Budget conscient 50/30/20" → réflexion, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 2 and order_index = 2;

-- L2/3 "Règle des 72 heures" → règle mentale, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 2 and order_index = 3;

-- L2/4 "Mesure taux d'épargne après 1 mois" → bilan ponctuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 2 and order_index = 4;

-- Niveau 3
-- L3/0 "Ouvre un PEA aujourd'hui — même avec 1 €" → RDV unique ouverture compte
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 3 and order_index = 0;

-- L3/1 "Comprends actif vs passif" → éducation, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 3 and order_index = 1;

-- L3/2 "Premier investissement mensuel automatique" → RDV unique pour configurer
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 3 and order_index = 2;

-- L3/3 "Calcule objectif épargne de précaution" → calcul, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 3 and order_index = 3;

-- L3/4 "Simulation intérêts composés 20 ans" → exercice mental, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 3 and order_index = 4;

-- Niveau 4
-- L4/0 "Optimise fiscalité PEA vs CTO vs AV" → RDV avec conseiller ou session dédiée
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 4 and order_index = 0;

-- L4/1 "Revenus passifs actuels — projette à 5 ans" → calcul ponctuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 4 and order_index = 1;

-- L4/2 "Bilan trimestriel finances" → bilan ponctuel récurrent mensuel/trimestriel
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 4 and order_index = 2;

-- L4/3 "Vision patrimoine" → réflexion, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'finances')
    and level_index = 4 and order_index = 3;


-- ╔══════════════════════════════════════════════════════════╗
-- ║  DOMAINE : TRAVAIL                                       ║
-- ╚══════════════════════════════════════════════════════════╝

-- Niveau 0 — Mesures baseline → null
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'travail')
    and level_index = 0;

-- Niveau 1 — Audits et diagnostics → null
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'travail')
    and level_index = 1;

-- Niveau 2
-- L2/0 "Bloque 2 heures de deep work dans ton agenda cette semaine" → routine hebdo récurrente
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'travail')
    and level_index = 2 and order_index = 0;

-- L2/1 "Propose une amélioration concrète à ton manager" → RDV unique
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'travail')
    and level_index = 2 and order_index = 1;

-- L2/2 "Négocie 1 tâche — délègue, supprime ou recadre" → conversation unique
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'travail')
    and level_index = 2 and order_index = 2;

-- L2/3 "Demande du feedback à 2 collègues" → conversations à planifier
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'travail')
    and level_index = 2 and order_index = 3;

-- L2/4 "Mesure l'impact d'une semaine de deep work" → bilan ponctuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'travail')
    and level_index = 2 and order_index = 4;

-- Niveau 3
-- L3/0 "Compétence signature" → réflexion, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'travail')
    and level_index = 3 and order_index = 0;

-- L3/1 "Plan de développement 90 jours" → actions hebdo récurrentes
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'travail')
    and level_index = 3 and order_index = 1;

-- L3/2 "Identifie et contacte 1 mentor dans 7 jours" → RDV unique (conversation)
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'travail')
    and level_index = 3 and order_index = 2;

-- L3/3 "Négocie — salaire, périmètre ou conditions" → RDV unique à haute valeur
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'travail')
    and level_index = 3 and order_index = 3;

-- L3/4 "Benchmark revenu mensuel" → bilan ponctuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'travail')
    and level_index = 3 and order_index = 4;

-- Niveau 4 → bilans et réflexions, pas de planification
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'travail')
    and level_index = 4;


-- ╔══════════════════════════════════════════════════════════╗
-- ║  DOMAINE : ENTREPRENEURIAT                               ║
-- ╚══════════════════════════════════════════════════════════╝

-- Niveau 0 — Prises de conscience → null
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 0;

-- Niveau 1
-- L1/0 "Identifie les 5 heures perdues" → audit mental, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 1 and order_index = 0;

-- L1/1 "Calcule ton taux horaire personnel" → calcul, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 1 and order_index = 1;

-- L1/2 "Bloque 3 créneaux projet dans ton calendrier" → routine hebdo projet
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 1 and order_index = 2;

-- L1/3 "3 objectifs pour ce mois" → bilan mensuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 1 and order_index = 3;

-- L1/4 "Consomme 1 ressource liée au problème actuel" → pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 1 and order_index = 4;

-- L1/5 "Première action de validation" → session de travail unique
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 1 and order_index = 5;

-- Niveau 2
-- L2/0 "Identifie 10 personnes avec le problème cible" → recherche, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 2 and order_index = 0;

-- L2/1 "3 conversations de découverte client cette semaine" → interviews récurrentes
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 2 and order_index = 1;

-- L2/2 "Teste le prix — demande à 5 personnes" → conversations ponctuelles
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 2 and order_index = 2;

-- L2/3 "Construis ton MVP en 1 heure" → session de travail focalisée
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 2 and order_index = 3;

-- L2/4 "Revue mensuelle" → RDV mensuel récurrent avec soi-même
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 2 and order_index = 4;

-- Niveau 3
-- L3/0 "Crée ta première offre — 30 minutes" → session de travail unique
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 3 and order_index = 0;

-- L3/1 "Envoie 10 messages de prospection directe cette semaine" → action récurrente hebdo
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 3 and order_index = 1;

-- L3/2 "Génère tes premiers revenus" → action ponctuelle clé
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 3 and order_index = 2;

-- L3/3 "Consomme et applique 1 ressource vente/marketing" → pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 3 and order_index = 3;

-- L3/4 "Revue financière mensuelle du projet" → RDV mensuel récurrent
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 3 and order_index = 4;

-- Niveau 4 → analyses et bilans, pas de planification immédiate
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'entrepreneuriat')
    and level_index = 4;


-- ╔══════════════════════════════════════════════════════════╗
-- ║  DOMAINE : BIEN-ÊTRE                                     ║
-- ╚══════════════════════════════════════════════════════════╝

-- Niveau 0 — Mesures baseline → null
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 0;

-- Niveau 1
-- L1/0 "5 minutes de respiration consciente — maintenant" → routine respiratoire quotidienne
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 1 and order_index = 0;

-- L1/1 "3 sources de joie authentique" → inventaire, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 1 and order_index = 1;

-- L1/2 "Pratique de gratitude — 3 choses ce soir" → routine gratitude quotidienne
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 1 and order_index = 2;

-- L1/3 "Note tes émotions 3 fois par jour pendant 3 jours" → tracking récurrent
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 1 and order_index = 3;

-- L1/4 "Planifie 1 moment de joie intentionnelle cette semaine" → RDV unique avec soi
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 1 and order_index = 4;

-- Niveau 2
-- L2/0 "Méditation 10 min — 7 jours de suite" → routine méditation quotidienne
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 2 and order_index = 0;

-- L2/1 "Identifie et réduis une source de stress chronique" → réflexion + action, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 2 and order_index = 1;

-- L2/2 "Améliore 1 relation — conversation en profondeur" → RDV à planifier avec quelqu'un
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 2 and order_index = 2;

-- L2/3 "Body scan — 15 minutes" → pratique corporelle récurrente
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 2 and order_index = 3;

-- L2/4 "Comparaison métriques baseline" → bilan ponctuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 2 and order_index = 4;

-- Niveau 3
-- L3/0 "Cartographie PERMA" → réflexion, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 3 and order_index = 0;

-- L3/1 "Action pilier PERMA le plus faible" → action ponctuelle ciblée
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 3 and order_index = 1;

-- L3/2 "Pleine conscience dans activité quotidienne — 7 jours" → pratique quotidienne
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 3 and order_index = 2;

-- L3/3 "Le sens — pourquoi ce que tu fais compte" → réflexion profonde, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 3 and order_index = 3;

-- L3/4 "Évalue et nourrit ta relation la plus précieuse" → RDV relationnel récurrent
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 3 and order_index = 4;

-- Niveau 4
-- L4/0 "Bilan trimestriel PERMA" → bilan ponctuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 4 and order_index = 0;

-- L4/1 "Rituel bien-être — 5 pratiques, 5 jours/semaine" → routine complète récurrente
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 4 and order_index = 1;

-- L4/2 "Vulnérabilité avec quelqu'un de confiance" → RDV unique, conversation profonde
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 4 and order_index = 2;

-- L4/3 "Vision 5 ans — 5 piliers PERMA" → réflexion, pas de RDV
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'bienetre')
    and level_index = 4 and order_index = 3;


-- ╔══════════════════════════════════════════════════════════╗
-- ║  DOMAINE : ÉCOLOGIE                                      ║
-- ╚══════════════════════════════════════════════════════════╝

-- Niveau 0 — Mesures baseline → null
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 0;

-- Niveau 1 — Audits et calculs → null
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 1;

-- Niveau 2
-- L2/0 "Remplace 1 trajet voiture par semaine — pendant 4 semaines" → routine transport récurrente
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 2 and order_index = 0;

-- L2/1 "Plan repas semaine — objectif zéro gaspillage" → routine hebdo planification repas
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 2 and order_index = 1;

-- L2/2 "Réduis ta consommation électrique — 5 gestes" → actions domestiques uniques
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 2 and order_index = 2;

-- L2/3 "Ton premier achat seconde main — cette semaine" → action unique
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 2 and order_index = 3;

-- L2/4 "Compare empreinte actuelle vs baseline" → bilan ponctuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 2 and order_index = 4;

-- Niveau 3
-- L3/0 "Bilan transport 3 mois" → bilan ponctuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 3 and order_index = 0;

-- L3/1 "Installe un système anti-gaspillage permanent dans ton frigo" → mise en place unique
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 3 and order_index = 1;

-- L3/2 "Audit appareils en veille" → audit ponctuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 3 and order_index = 2;

-- L3/3 "2 repas végétariens supplémentaires par semaine" → routine alimentaire récurrente
update challenges set scheduling_type = 'recurring'
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 3 and order_index = 3;

-- L3/4 "Bilan 3 mois" → bilan ponctuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 3 and order_index = 4;

-- Niveau 4
-- L4/0 "Calcule distance à l'objectif 2 tonnes" → calcul ponctuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 4 and order_index = 0;

-- L4/1 "Mesure impact de tes habitudes sur ta facture annuelle" → calcul ponctuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 4 and order_index = 1;

-- L4/2 "Élargis ton impact — 1 action collective ce mois" → action ponctuelle
update challenges set scheduling_type = 'one_time'
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 4 and order_index = 2;

-- L4/3 "Bilan trimestriel complet — vision 12 mois" → bilan ponctuel
update challenges set scheduling_type = null
  where domain_id = (select id from domains where slug = 'ecologie')
    and level_index = 4 and order_index = 3;


-- ─────────────────────────────────────────────────────────────────────────────
-- Partie B : Table CLAUDE_DEBUG — challenge_notes
-- Permet à l'admin de commenter chaque défi depuis l'app
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists challenge_notes (
  id           uuid default gen_random_uuid() primary key,
  challenge_id uuid references challenges(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  note         text not null,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null,
  unique (challenge_id, user_id)  -- 1 note par défi par utilisateur (upsert)
);

comment on table challenge_notes is
  'Notes de debug/feedback admin sur chaque défi — utilisé par Claude pour affiner le contenu';

alter table challenge_notes enable row level security;

create policy "user_owns_challenge_notes" on challenge_notes
  for all using (auth.uid() = user_id);

-- Index pour récupérer toutes les notes d'un utilisateur rapidement
create index if not exists challenge_notes_user_idx
  on challenge_notes (user_id, challenge_id);
