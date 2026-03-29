-- ============================================================
-- Migration 012 : Mise à jour de delete_user_account()
-- Couvre les tables ajoutées dans les migrations 009-011 :
--   google_oauth_tokens, calendar_sync_map, push_subscriptions
-- ============================================================

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

  -- Tables avec ON DELETE CASCADE — supprimées explicitement par clarté
  delete from public.challenge_completions  where user_id = v_user_id;
  delete from public.user_metrics           where user_id = v_user_id;
  delete from public.user_domain_progress   where user_id = v_user_id;
  delete from public.calendar_events        where user_id = v_user_id;
  delete from public.challenge_notes        where user_id = v_user_id;

  -- Tables ajoutées dans migrations 009-011
  delete from public.google_oauth_tokens    where user_id = v_user_id;
  delete from public.calendar_sync_map      where user_id = v_user_id;
  delete from public.push_subscriptions     where user_id = v_user_id;

  delete from public.profiles               where id      = v_user_id;

  -- Supprime le compte auth (nécessite SECURITY DEFINER)
  delete from auth.users where id = v_user_id;
end;
$$;

-- Permissions inchangées
revoke execute on function delete_user_account() from public;
grant  execute on function delete_user_account() to authenticated;
