-- Migration 006 : Ajout du type de planification sur les défis
-- Permet de configurer depuis Supabase si un défi doit être planifié
-- dans le calendrier (one_time = RDV unique, recurring = séances régulières)

alter table challenges
  add column if not exists scheduling_type text
    check (scheduling_type in ('one_time', 'recurring'))
    default null;

comment on column challenges.scheduling_type is
  'null = pas de planification ; one_time = RDV unique à caler ; recurring = séances régulières à inscrire en routine';

-- Exemples de mise à jour à exécuter après la migration :
-- Défis "ponctuel / rendez-vous unique" (Santé)
-- update challenges set scheduling_type = 'one_time'
--   where title ilike '%bilan%' or title ilike '%rendez-vous%' or title ilike '%rdv%';

-- Défis "habitude régulière" (Sport, Méditation, etc.)
-- update challenges set scheduling_type = 'recurring'
--   where title ilike '%séance%' or title ilike '%sport%' or title ilike '%méditation%'
--      or title ilike '%marche%' or title ilike '%exercice%';
