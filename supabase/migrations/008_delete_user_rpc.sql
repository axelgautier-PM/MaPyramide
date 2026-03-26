-- ============================================================
-- Migration 008 : Fonction RPC pour suppression de compte
-- Appelée depuis app/app/profil/page.tsx via supabase.rpc("delete_user_account")
-- ============================================================

-- Supprime toutes les données de l'utilisateur connecté puis son compte auth.
-- SECURITY DEFINER : s'exécute avec les droits du créateur (postgres) pour
-- pouvoir supprimer dans auth.users sans accès admin côté client.

create or replace function delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  -- Vérifie qu'un utilisateur est bien connecté
  if v_user_id is null then
    raise exception 'Non authentifié';
  end if;

  -- Les tables suivantes ont ON DELETE CASCADE sur user_id,
  -- donc la suppression de auth.users suffit à tout nettoyer.
  -- On les supprime explicitement par sécurité et pour la lisibilité.
  delete from public.challenge_completions where user_id = v_user_id;
  delete from public.user_metrics          where user_id = v_user_id;
  delete from public.user_domain_progress  where user_id = v_user_id;
  delete from public.calendar_events       where user_id = v_user_id;
  delete from public.challenge_notes       where user_id = v_user_id;
  delete from public.profiles              where id      = v_user_id;

  -- Supprime le compte auth (nécessite SECURITY DEFINER)
  delete from auth.users where id = v_user_id;
end;
$$;

-- Retire les droits d'exécution publics par défaut, puis les accorde aux users authentifiés uniquement
revoke execute on function delete_user_account() from public;
grant  execute on function delete_user_account() to authenticated;
