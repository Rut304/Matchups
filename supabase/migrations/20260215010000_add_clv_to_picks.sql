-- Add CLV tracking columns to picks table
ALTER TABLE public.picks ADD COLUMN IF NOT EXISTS clv NUMERIC(5,2);
ALTER TABLE public.picks ADD COLUMN IF NOT EXISTS close_spread NUMERIC(5,2);
ALTER TABLE public.picks ADD COLUMN IF NOT EXISTS close_total NUMERIC(5,2);
