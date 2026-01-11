-- Add more TV commentators, experts, and ex-players to cappers table
-- Run this in Supabase SQL Editor

-- Additional ESPN personalities
INSERT INTO public.cappers (slug, name, avatar_emoji, verified, capper_type, network, role, followers_count, is_active, is_featured)
VALUES 
  -- ESPN Basketball
  ('jay-bilas', 'Jay Bilas', '🏀', true, 'celebrity'::capper_type, 'ESPN', 'College Basketball Analyst', '890K', true, true),
  ('jay-williams', 'Jay Williams', '🏀', true, 'celebrity'::capper_type, 'ESPN', 'NBA Analyst', '567K', true, false),
  ('michael-wilbon', 'Michael Wilbon', '📺', true, 'celebrity'::capper_type, 'ESPN', 'PTI Host', '1.2M', true, true),
  ('tony-kornheiser', 'Tony Kornheiser', '🎭', true, 'celebrity'::capper_type, 'ESPN', 'PTI Host', '890K', true, true),
  ('pablo-torre', 'Pablo Torre', '📝', true, 'celebrity'::capper_type, 'ESPN', 'Around The Horn', '345K', true, false),
  ('bomani-jones', 'Bomani Jones', '🎤', true, 'celebrity'::capper_type, 'ESPN', 'Around The Horn', '456K', true, false),
  ('rachel-nichols', 'Rachel Nichols', '📺', true, 'celebrity'::capper_type, 'Independent', 'Former ESPN', '678K', true, false),
  
  -- More NFL Legends
  ('randy-moss', 'Randy Moss', '🏈', true, 'celebrity'::capper_type, 'ESPN', 'NFL Countdown', '1.8M', true, true),
  ('michael-strahan', 'Michael Strahan', '💪', true, 'celebrity'::capper_type, 'FOX', 'NFL Sunday', '3.2M', true, true),
  ('terry-bradshaw', 'Terry Bradshaw', '🏆', true, 'celebrity'::capper_type, 'FOX', 'NFL Sunday', '2.1M', true, true),
  ('howie-long', 'Howie Long', '🏈', true, 'celebrity'::capper_type, 'FOX', 'NFL Sunday', '890K', true, false),
  ('jimmy-johnson', 'Jimmy Johnson', '🏆', true, 'celebrity'::capper_type, 'FOX', 'NFL Sunday', '1.4M', true, true),
  ('deion-sanders', 'Deion Sanders', '⚡', true, 'celebrity'::capper_type, 'Multiple', 'Coach/Analyst', '4.5M', true, true),
  ('mike-ditka', 'Mike Ditka', '🐻', true, 'celebrity'::capper_type, 'Retired', 'NFL Legend', '567K', true, true),
  ('emmitt-smith', 'Emmitt Smith', '⭐', true, 'celebrity'::capper_type, 'NFL Network', 'NFL Analyst', '890K', true, true),
  ('jerry-rice', 'Jerry Rice', '🐐', true, 'celebrity'::capper_type, 'Multiple', 'NFL Legend', '1.2M', true, true),
  ('lawrence-taylor', 'Lawrence Taylor', '💪', true, 'celebrity'::capper_type, 'Retired', 'NFL Legend', '456K', true, false),
  ('ray-lewis', 'Ray Lewis', '🔥', true, 'celebrity'::capper_type, 'ESPN', 'NFL Analyst', '2.1M', true, true),
  ('brian-urlacher', 'Brian Urlacher', '🐻', true, 'celebrity'::capper_type, 'FOX', 'NFL Analyst', '567K', true, false),
  ('marshall-faulk', 'Marshall Faulk', '🏃', true, 'celebrity'::capper_type, 'NFL Network', 'NFL GameDay', '345K', true, false),
  ('warren-sapp', 'Warren Sapp', '💪', true, 'celebrity'::capper_type, 'NFL Network', 'NFL GameDay', '567K', true, false),
  ('steve-smith-sr', 'Steve Smith Sr', '😤', true, 'celebrity'::capper_type, 'NFL Network', 'NFL Analyst', '890K', true, true),
  ('cam-newton', 'Cam Newton', '🎭', true, 'celebrity'::capper_type, 'ESPN', 'Funky Friday', '2.8M', true, true),
  ('chad-johnson', 'Chad Johnson', '🎉', true, 'celebrity'::capper_type, 'Podcast', 'Nightcap', '3.2M', true, true),
  
  -- NBA Legends
  ('paul-pierce', 'Paul Pierce', '☘️', true, 'celebrity'::capper_type, 'ESPN', 'NBA Countdown', '2.1M', true, true),
  ('vince-carter', 'Vince Carter', '🦖', true, 'celebrity'::capper_type, 'ESPN', 'NBA Analyst', '1.8M', true, true),
  ('baron-davis', 'Baron Davis', '🏀', true, 'celebrity'::capper_type, 'Podcast', 'The Pivot', '567K', true, false),
  ('gilbert-arenas', 'Gilbert Arenas', '🔫', true, 'celebrity'::capper_type, 'Podcast', 'No Chill', '1.2M', true, true),
  ('matt-barnes', 'Matt Barnes', '🏀', true, 'celebrity'::capper_type, 'Podcast', 'All The Smoke', '890K', true, true),
  ('stephen-jackson', 'Stephen Jackson', '🏀', true, 'celebrity'::capper_type, 'Podcast', 'All The Smoke', '1.1M', true, true),
  ('candace-parker', 'Candace Parker', '🏀', true, 'celebrity'::capper_type, 'TNT', 'Inside the NBA', '890K', true, true),
  ('reggie-miller', 'Reggie Miller', '🏀', true, 'celebrity'::capper_type, 'TNT', 'NBA Analyst', '1.4M', true, true),
  ('chris-webber', 'Chris Webber', '🏀', true, 'celebrity'::capper_type, 'TNT', 'NBA Analyst', '890K', true, false),
  ('grant-hill', 'Grant Hill', '🏀', true, 'celebrity'::capper_type, 'TNT', 'Inside the NBA', '678K', true, false),
  ('isiah-thomas', 'Isiah Thomas', '🏀', true, 'celebrity'::capper_type, 'NBA TV', 'NBA GameTime', '1.2M', true, true),
  
  -- MLB Legends
  ('frank-thomas', 'Frank Thomas', '💪', true, 'celebrity'::capper_type, 'FOX', 'MLB Analyst', '567K', true, true),
  ('john-smoltz', 'John Smoltz', '⚾', true, 'celebrity'::capper_type, 'FOX', 'MLB Analyst', '456K', true, false),
  ('pedro-martinez', 'Pedro Martinez', '⚾', true, 'celebrity'::capper_type, 'TBS', 'MLB Analyst', '890K', true, true),
  ('jimmy-rollins', 'Jimmy Rollins', '⚾', true, 'celebrity'::capper_type, 'NBC', 'MLB Analyst', '345K', true, false),
  ('cc-sabathia', 'CC Sabathia', '⚾', true, 'celebrity'::capper_type, 'Podcast', 'R2C2', '567K', true, true),
  
  -- NHL Legends
  ('wayne-gretzky', 'Wayne Gretzky', '🏒', true, 'celebrity'::capper_type, 'TNT', 'NHL Analyst', '1.8M', true, true),
  ('mark-messier', 'Mark Messier', '🏒', true, 'celebrity'::capper_type, 'NHL Network', 'NHL Analyst', '567K', true, true),
  ('patrick-roy', 'Patrick Roy', '🏒', true, 'celebrity'::capper_type, 'NHL Network', 'NHL Analyst', '456K', true, false),
  ('jeremy-roenick', 'Jeremy Roenick', '🏒', true, 'celebrity'::capper_type, 'NBC', 'NHL Analyst', '345K', true, false),
  
  -- Betting Experts & Analysts
  ('todd-fuhrman', 'Todd Fuhrman', '💰', true, 'pro'::capper_type, 'FS1', 'Lock It In', '234K', true, true),
  ('kelly-stewart', 'Kelly Stewart', '💎', true, 'pro'::capper_type, 'VSiN', 'Betting Analyst', '189K', true, true),
  ('brent-musburger', 'Brent Musburger', '🎙️', true, 'celebrity'::capper_type, 'VSiN', 'Founder', '567K', true, true),
  ('rj-bell', 'RJ Bell', '🔔', true, 'pro'::capper_type, 'Pregame', 'Betting Expert', '145K', true, false),
  ('chad-millman', 'Chad Millman', '📊', true, 'pro'::capper_type, 'Action Network', 'CEO', '123K', true, true),
  ('darren-rovell', 'Darren Rovell', '💵', true, 'celebrity'::capper_type, 'Action Network', 'Sports Business', '2.1M', true, false),
  ('blackjack-fletcher', 'Blackjack Fletcher', '🃏', true, 'pro'::capper_type, 'Independent', 'Pro Bettor', '89K', true, true),
  ('mike-palm', 'Mike Palm', '🌴', true, 'pro'::capper_type, 'Sports Insights', 'Sharp Expert', '67K', true, false),
  
  -- More Podcasters/Media
  ('colin-dunne', 'Colin Dunne', '🎙️', true, 'celebrity'::capper_type, 'Podcast', 'Unnecessary Roughness', '234K', true, false),
  ('ryan-hollins', 'Ryan Hollins', '🏀', true, 'celebrity'::capper_type, 'CBS', 'NBA Analyst', '123K', true, false),
  ('chris-mannix', 'Chris Mannix', '🏀', true, 'celebrity'::capper_type, 'Sports Illustrated', 'NBA Writer', '345K', true, false),
  ('brian-windhorst', 'Brian Windhorst', '📝', true, 'celebrity'::capper_type, 'ESPN', 'NBA Reporter', '567K', true, true),
  ('woj', 'Adrian Wojnarowski', '💣', true, 'celebrity'::capper_type, 'ESPN', 'NBA Insider', '5.8M', true, true),
  ('shams', 'Shams Charania', '💣', true, 'celebrity'::capper_type, 'The Athletic', 'NBA Insider', '2.1M', true, true),
  ('adam-schefter', 'Adam Schefter', '🏈', true, 'celebrity'::capper_type, 'ESPN', 'NFL Insider', '9.8M', true, true),
  ('ian-rapoport', 'Ian Rapoport', '🏈', true, 'celebrity'::capper_type, 'NFL Network', 'NFL Insider', '3.2M', true, true),
  ('jeff-passan', 'Jeff Passan', '⚾', true, 'celebrity'::capper_type, 'ESPN', 'MLB Insider', '1.8M', true, true),
  ('chris-russo', 'Chris Mad Dog Russo', '🐕', true, 'celebrity'::capper_type, 'SiriusXM/ESPN', 'First Take', '345K', true, true)
  
ON CONFLICT (slug) DO NOTHING;

-- Insert stats for new cappers
INSERT INTO public.capper_stats (capper_id, total_picks, total_wins, total_losses, total_pushes, win_percentage, net_units, roi_percentage, current_streak, overall_rank)
SELECT 
  c.id,
  (50 + floor(random() * 200))::int as total_picks,
  (30 + floor(random() * 100))::int as total_wins,
  (20 + floor(random() * 80))::int as total_losses,
  floor(random() * 15)::int as total_pushes,
  (48 + random() * 20)::decimal(5,2) as win_percentage,
  (-15 + random() * 80)::decimal(10,2) as net_units,
  (-8 + random() * 25)::decimal(6,2) as roi_percentage,
  CASE WHEN random() > 0.5 THEN 'W' ELSE 'L' END || (1 + floor(random() * 8))::text,
  NULL -- Will be computed
FROM public.cappers c
WHERE NOT EXISTS (SELECT 1 FROM public.capper_stats WHERE capper_id = c.id);

-- Update ranks based on ROI
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY roi_percentage DESC) as new_rank
  FROM public.capper_stats
)
UPDATE public.capper_stats cs
SET overall_rank = r.new_rank
FROM ranked r
WHERE cs.id = r.id;

-- Verify counts
SELECT 'Total Cappers' as metric, count(*) as value FROM public.cappers
UNION ALL
SELECT 'With Stats' as metric, count(*) as value FROM public.capper_stats
UNION ALL
SELECT 'Celebrities' as metric, count(*) as value FROM public.cappers WHERE capper_type = 'celebrity'
UNION ALL
SELECT 'Pros' as metric, count(*) as value FROM public.cappers WHERE capper_type = 'pro';
