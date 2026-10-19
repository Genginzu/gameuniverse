-- Lock fantasy esport writes that trusted the client.
--
-- Context (fantasy is not exposed in the UI yet, no league exists):
--   * fantasy_teams INSERT let the player choose budget_remaining and
--     total_points (leaderboard score) on their own team.
--   * fantasy_team_players INSERT accepted any pro_player_id / name and any
--     purchase_price > 0 straight from the client, and the API trusted a
--     client-supplied price; the budget was never debited (no UPDATE policy).
--   There is no server-side price for pro players yet, so roster changes cannot
--   be validated.
--
-- Fix:
--   1. BEFORE INSERT trigger on fantasy_teams (interactive callers): the league
--      must be active, budget_remaining is set to the league budget_cap and
--      total_points to 0.
--   2. Client INSERT / DELETE policies on fantasy_team_players are dropped:
--      roster changes are server-only until a pricing model exists (the API
--      returns 501 for addPlayer / removePlayer).

CREATE OR REPLACE FUNCTION public.enforce_fantasy_team_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_budget integer;
BEGIN
  IF auth.role() NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  SELECT l.budget_cap INTO v_budget
  FROM public.fantasy_leagues l
  WHERE l.id = NEW.league_id AND l.status = 'active';

  IF v_budget IS NULL THEN
    RAISE EXCEPTION 'fantasy_teams: league is not open' USING ERRCODE = '42501';
  END IF;

  NEW.budget_remaining := v_budget;
  NEW.total_points := 0;
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_fantasy_team_insert() IS
  'Client-created fantasy teams start with the league budget and 0 points, in an active league only.';

REVOKE EXECUTE ON FUNCTION public.enforce_fantasy_team_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_fantasy_team_insert ON public.fantasy_teams;
CREATE TRIGGER trg_enforce_fantasy_team_insert
  BEFORE INSERT ON public.fantasy_teams
  FOR EACH ROW EXECUTE FUNCTION public.enforce_fantasy_team_insert();

DROP POLICY IF EXISTS "Players can manage their team players" ON public.fantasy_team_players;
DROP POLICY IF EXISTS "Players can delete their team players" ON public.fantasy_team_players;
