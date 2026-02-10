-- ===========================================
-- CLEANUP FAKE DATA
-- Run this in Supabase SQL Editor to clear all seeded fake data
-- Keep only REAL data from scrapers
-- ===========================================

-- Clear all fake capper data (will cascade to related tables)
TRUNCATE TABLE public.capper_stats CASCADE;
TRUNCATE TABLE public.picks CASCADE;
TRUNCATE TABLE public.cappers CASCADE;

-- Clear fake sus plays data  
TRUNCATE TABLE public.sus_plays CASCADE;

-- Verify tables are empty
SELECT 'cappers' as table_name, COUNT(*) as count FROM public.cappers
UNION ALL
SELECT 'capper_stats', COUNT(*) FROM public.capper_stats
UNION ALL
SELECT 'picks', COUNT(*) FROM public.picks
UNION ALL
SELECT 'sus_plays', COUNT(*) FROM public.sus_plays;
