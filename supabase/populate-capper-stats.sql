-- Manual population of capper_stats for all existing cappers
-- Run this in Supabase SQL Editor after picks have been seeded

-- First, ensure the compute_capper_stats function exists
CREATE OR REPLACE FUNCTION compute_capper_stats(p_capper_id UUID)
RETURNS void AS $$
DECLARE
  v_wins INTEGER;
  v_losses INTEGER;
  v_pushes INTEGER;
  v_total INTEGER;
  v_units_won DECIMAL;
  v_units_wagered DECIMAL;
  v_streak TEXT := 'N/A';
  v_last_result TEXT;
  v_streak_count INTEGER := 0;
  rec RECORD;
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
  
  -- Calculate streak using a simple loop
  FOR rec IN 
    SELECT result FROM public.picks 
    WHERE capper_id = p_capper_id AND result IN ('win', 'loss', 'push')
    ORDER BY picked_at DESC
  LOOP
    IF v_last_result IS NULL THEN
      v_last_result := rec.result;
      v_streak_count := 1;
    ELSIF rec.result = v_last_result THEN
      v_streak_count := v_streak_count + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  IF v_last_result IS NOT NULL THEN
    v_streak := CASE v_last_result 
      WHEN 'win' THEN 'W' 
      WHEN 'loss' THEN 'L' 
      ELSE 'P' 
    END || v_streak_count::TEXT;
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

-- Now populate stats for ALL cappers
DO $$
DECLARE
  capper_rec RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR capper_rec IN SELECT id FROM public.cappers LOOP
    PERFORM compute_capper_stats(capper_rec.id);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Computed stats for % cappers', v_count;
END $$;

-- Verify the population
SELECT 
  c.name,
  cs.total_picks,
  cs.total_wins,
  cs.total_losses,
  cs.win_percentage,
  cs.net_units,
  cs.roi_percentage,
  cs.current_streak
FROM public.capper_stats cs
JOIN public.cappers c ON c.id = cs.capper_id
ORDER BY cs.roi_percentage DESC
LIMIT 20;
