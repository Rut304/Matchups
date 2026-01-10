-- FIX: The compute_capper_stats function has nested window functions which PostgreSQL doesn't allow
-- This is a fixed version that calculates the streak correctly

-- First, drop the trigger temporarily
DROP TRIGGER IF EXISTS picks_stats_update ON public.picks;

-- Replace the function with a fixed version
CREATE OR REPLACE FUNCTION compute_capper_stats(p_capper_id UUID)
RETURNS void AS $$
DECLARE
  v_wins INTEGER;
  v_losses INTEGER;
  v_pushes INTEGER;
  v_total INTEGER;
  v_units_won DECIMAL;
  v_units_wagered DECIMAL;
  v_streak TEXT;
  v_streak_count INTEGER;
  v_last_result TEXT;
BEGIN
  -- Calculate overall stats
  SELECT 
    COUNT(*) FILTER (WHERE result = 'win'),
    COUNT(*) FILTER (WHERE result = 'loss'),
    COUNT(*) FILTER (WHERE result = 'push'),
    COUNT(*) FILTER (WHERE result IN ('win', 'loss', 'push')),
    COALESCE(SUM(CASE 
      WHEN result = 'win' THEN units * (CASE WHEN odds_at_pick > 0 THEN odds_at_pick::decimal/100 ELSE 100.0/ABS(NULLIF(odds_at_pick, 0)) END)
      WHEN result = 'loss' THEN -units
      ELSE 0 
    END), 0),
    COALESCE(SUM(units) FILTER (WHERE result IN ('win', 'loss')), 0)
  INTO v_wins, v_losses, v_pushes, v_total, v_units_won, v_units_wagered
  FROM public.picks
  WHERE capper_id = p_capper_id AND result IS NOT NULL;
  
  -- Calculate current streak (fixed - no nested window functions)
  -- First get the most recent result
  SELECT result INTO v_last_result
  FROM public.picks
  WHERE capper_id = p_capper_id AND result IN ('win', 'loss', 'push')
  ORDER BY picked_at DESC
  LIMIT 1;
  
  -- Then count consecutive same results from the most recent
  IF v_last_result IS NOT NULL THEN
    SELECT COUNT(*) INTO v_streak_count
    FROM (
      SELECT result, picked_at,
             ROW_NUMBER() OVER (ORDER BY picked_at DESC) as rn
      FROM public.picks
      WHERE capper_id = p_capper_id AND result IN ('win', 'loss', 'push')
      ORDER BY picked_at DESC
    ) ranked
    WHERE result = v_last_result
      AND rn = (
        SELECT COUNT(*) 
        FROM public.picks p2 
        WHERE p2.capper_id = p_capper_id 
          AND p2.result IN ('win', 'loss', 'push')
          AND p2.picked_at >= ranked.picked_at
          AND p2.result = v_last_result
      );
    
    -- Simpler streak calculation
    WITH ordered_picks AS (
      SELECT result, picked_at,
             ROW_NUMBER() OVER (ORDER BY picked_at DESC) as rn
      FROM public.picks
      WHERE capper_id = p_capper_id AND result IN ('win', 'loss', 'push')
    )
    SELECT COUNT(*) INTO v_streak_count
    FROM ordered_picks op
    WHERE NOT EXISTS (
      SELECT 1 FROM ordered_picks op2 
      WHERE op2.rn < op.rn AND op2.result != v_last_result
    ) AND op.result = v_last_result;
    
    v_streak := CASE v_last_result 
      WHEN 'win' THEN 'W' 
      WHEN 'loss' THEN 'L' 
      ELSE 'P' 
    END || GREATEST(v_streak_count, 1)::TEXT;
  ELSE
    v_streak := 'N/A';
  END IF;
  
  -- Upsert stats
  INSERT INTO public.capper_stats (
    capper_id, total_picks, total_wins, total_losses, total_pushes,
    win_percentage, total_units_wagered, total_units_won, net_units, roi_percentage,
    current_streak, computed_at
  ) VALUES (
    p_capper_id, v_total, v_wins, v_losses, v_pushes,
    CASE WHEN (v_wins + v_losses) > 0 THEN ROUND(v_wins::decimal / (v_wins + v_losses) * 100, 1) ELSE 0 END,
    v_units_wagered, v_units_won, ROUND(v_units_won, 1),
    CASE WHEN v_units_wagered > 0 THEN ROUND(v_units_won / v_units_wagered * 100, 1) ELSE 0 END,
    COALESCE(v_streak, 'N/A'), NOW()
  )
  ON CONFLICT (capper_id) DO UPDATE SET
    total_picks = EXCLUDED.total_picks,
    total_wins = EXCLUDED.total_wins,
    total_losses = EXCLUDED.total_losses,
    total_pushes = EXCLUDED.total_pushes,
    win_percentage = EXCLUDED.win_percentage,
    total_units_wagered = EXCLUDED.total_units_wagered,
    total_units_won = EXCLUDED.total_units_won,
    net_units = EXCLUDED.net_units,
    roi_percentage = EXCLUDED.roi_percentage,
    current_streak = EXCLUDED.current_streak,
    computed_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER picks_stats_update
AFTER INSERT OR UPDATE OR DELETE ON public.picks
FOR EACH ROW EXECUTE FUNCTION trigger_update_capper_stats();
