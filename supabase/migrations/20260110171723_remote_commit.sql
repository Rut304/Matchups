


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."bet_type" AS ENUM (
    'spread',
    'moneyline',
    'over_under',
    'prop',
    'parlay',
    'teaser',
    'futures'
);


ALTER TYPE "public"."bet_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_payout"("odds" integer, "stake" numeric) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  IF odds > 0 THEN
    RETURN stake * (odds / 100.0);
  ELSE
    RETURN stake * (100.0 / ABS(odds));
  END IF;
END;
$$;


ALTER FUNCTION "public"."calculate_payout"("odds" integer, "stake" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compute_capper_stats"("p_capper_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_wins INTEGER;
  v_losses INTEGER;
  v_pushes INTEGER;
  v_total INTEGER;
  v_units_won DECIMAL;
  v_units_wagered DECIMAL;
  v_streak TEXT;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE result = 'win'),
    COUNT(*) FILTER (WHERE result = 'loss'),
    COUNT(*) FILTER (WHERE result = 'push'),
    COUNT(*) FILTER (WHERE result IN ('win', 'loss', 'push')),
    COALESCE(SUM(CASE 
      WHEN result = 'win' THEN units * (CASE WHEN odds_at_pick > 0 THEN odds_at_pick::decimal/100 ELSE 100.0/ABS(odds_at_pick) END)
      WHEN result = 'loss' THEN -units
      ELSE 0 
    END), 0),
    COALESCE(SUM(units) FILTER (WHERE result IN ('win', 'loss')), 0)
  INTO v_wins, v_losses, v_pushes, v_total, v_units_won, v_units_wagered
  FROM public.picks
  WHERE capper_id = p_capper_id AND result IS NOT NULL;
  
  SELECT 
    CASE 
      WHEN result = 'win' THEN 'W' || COUNT(*)
      WHEN result = 'loss' THEN 'L' || COUNT(*)
      ELSE 'P' || COUNT(*)
    END
  INTO v_streak
  FROM (
    SELECT result, 
           SUM(CASE WHEN result != LAG(result) OVER (ORDER BY picked_at DESC) THEN 1 ELSE 0 END) OVER (ORDER BY picked_at DESC) as grp
    FROM public.picks 
    WHERE capper_id = p_capper_id AND result IN ('win', 'loss', 'push')
    ORDER BY picked_at DESC
  ) sub
  WHERE grp = 0
  GROUP BY result
  LIMIT 1;
  
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
$$;


ALTER FUNCTION "public"."compute_capper_stats"("p_capper_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_betting_stats"("p_user_id" "uuid") RETURNS TABLE("total_bets" bigint, "wins" bigint, "losses" bigint, "pushes" bigint, "pending" bigint, "win_rate" numeric, "total_staked" numeric, "total_profit" numeric, "roi" numeric, "avg_odds" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_bets,
    COUNT(*) FILTER (WHERE status = 'won')::BIGINT as wins,
    COUNT(*) FILTER (WHERE status = 'lost')::BIGINT as losses,
    COUNT(*) FILTER (WHERE status = 'push')::BIGINT as pushes,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending,
    CASE 
      WHEN COUNT(*) FILTER (WHERE status IN ('won', 'lost')) > 0 
      THEN ROUND(COUNT(*) FILTER (WHERE status = 'won')::DECIMAL / COUNT(*) FILTER (WHERE status IN ('won', 'lost')) * 100, 2)
      ELSE 0 
    END as win_rate,
    COALESCE(SUM(stake), 0) as total_staked,
    COALESCE(SUM(
      CASE 
        WHEN status = 'won' THEN actual_payout - stake
        WHEN status = 'lost' THEN -stake
        ELSE 0
      END
    ), 0) as total_profit,
    CASE 
      WHEN SUM(stake) FILTER (WHERE status IN ('won', 'lost')) > 0 
      THEN ROUND(
        SUM(
          CASE 
            WHEN status = 'won' THEN actual_payout - stake
            WHEN status = 'lost' THEN -stake
            ELSE 0
          END
        ) / SUM(stake) FILTER (WHERE status IN ('won', 'lost')) * 100, 2
      )
      ELSE 0
    END as roi,
    ROUND(AVG(odds)::DECIMAL, 0) as avg_odds
  FROM public.user_bets
  WHERE user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_betting_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_system_pick_settled"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.result IS DISTINCT FROM OLD.result AND NEW.result IN ('win', 'loss', 'push') THEN
    PERFORM public.update_system_stats(NEW.system_id);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."on_system_pick_settled"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_capper_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM compute_capper_stats(OLD.capper_id);
    RETURN OLD;
  ELSE
    PERFORM compute_capper_stats(NEW.capper_id);
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."trigger_update_capper_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_expert_stats_on_pick"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- This would recalculate stats for the expert
  -- Simplified version - in production, use a background job
  UPDATE expert_stats
  SET 
    wins = CASE WHEN NEW.result = 'win' THEN wins + 1 ELSE wins END,
    losses = CASE WHEN NEW.result = 'loss' THEN losses + 1 ELSE losses END,
    pushes = CASE WHEN NEW.result = 'push' THEN pushes + 1 ELSE pushes END,
    pending = CASE WHEN OLD.result = 'pending' THEN pending - 1 ELSE pending END,
    total_picks = total_picks,
    net_units = net_units + COALESCE(NEW.payout, 0),
    win_pct = CASE WHEN (wins + losses) > 0 THEN (wins::DECIMAL / (wins + losses) * 100) ELSE 0 END,
    calculated_at = NOW()
  WHERE expert_id = NEW.expert_id 
    AND timeframe = 'all'
    AND (sport IS NULL OR sport = NEW.sport);
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_expert_stats_on_pick"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_system_followers_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_systems 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.system_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_systems 
    SET followers_count = followers_count - 1 
    WHERE id = OLD.system_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_system_followers_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_system_stats"("p_system_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_wins INTEGER;
  v_losses INTEGER;
  v_pushes INTEGER;
  v_total_profit DECIMAL;
  v_total_bets INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE result = 'win'),
    COUNT(*) FILTER (WHERE result = 'loss'),
    COUNT(*) FILTER (WHERE result = 'push'),
    COALESCE(SUM(profit), 0),
    COUNT(*) FILTER (WHERE result IN ('win', 'loss', 'push'))
  INTO v_wins, v_losses, v_pushes, v_total_profit, v_total_bets
  FROM public.system_picks
  WHERE system_id = p_system_id;

  UPDATE public.user_systems
  SET 
    stats = jsonb_build_object(
      'record', v_wins || '-' || v_losses || '-' || v_pushes,
      'winPct', CASE WHEN (v_wins + v_losses) > 0 
                     THEN ROUND((v_wins::DECIMAL / (v_wins + v_losses)) * 100, 1) 
                     ELSE 0 END,
      'roi', CASE WHEN v_total_bets > 0 
                  THEN ROUND((v_total_profit / v_total_bets) * 100, 1) 
                  ELSE 0 END,
      'units', ROUND(v_total_profit, 2),
      'avgOdds', -110,
      'clv', 0,
      'maxDrawdown', 0,
      'sharpeRatio', 0,
      'kellyPct', 0
    ),
    updated_at = NOW()
  WHERE id = p_system_id;
END;
$$;


ALTER FUNCTION "public"."update_system_stats"("p_system_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_picks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "game_id" "uuid",
    "pick_type" "text" NOT NULL,
    "pick_value" "text" NOT NULL,
    "confidence" integer,
    "reasoning" "text",
    "factors" "jsonb",
    "model_version" "text",
    "is_best_bet" boolean DEFAULT false,
    "result" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_picks_confidence_check" CHECK ((("confidence" >= 0) AND ("confidence" <= 100))),
    CONSTRAINT "ai_picks_pick_type_check" CHECK (("pick_type" = ANY (ARRAY['spread'::"text", 'total'::"text", 'moneyline'::"text", 'prop'::"text"]))),
    CONSTRAINT "ai_picks_result_check" CHECK (("result" = ANY (ARRAY['win'::"text", 'loss'::"text", 'push'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."ai_picks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."betting_splits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "game_id" "uuid",
    "spread_home_pct" integer,
    "spread_away_pct" integer,
    "moneyline_home_pct" integer,
    "moneyline_away_pct" integer,
    "total_over_pct" integer,
    "total_under_pct" integer,
    "ticket_count" integer,
    "money_pct_spread_home" integer,
    "money_pct_total_over" integer,
    "source" "text",
    "fetched_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."betting_splits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."capper_stats" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "capper_id" "uuid" NOT NULL,
    "total_picks" integer DEFAULT 0,
    "total_wins" integer DEFAULT 0,
    "total_losses" integer DEFAULT 0,
    "total_pushes" integer DEFAULT 0,
    "win_percentage" numeric(5,2) DEFAULT 0,
    "total_units_wagered" numeric(10,2) DEFAULT 0,
    "total_units_won" numeric(10,2) DEFAULT 0,
    "net_units" numeric(10,2) DEFAULT 0,
    "roi_percentage" numeric(6,2) DEFAULT 0,
    "current_streak" "text",
    "best_streak" "text",
    "worst_streak" "text",
    "overall_rank" integer,
    "previous_rank" integer,
    "rank_change" integer DEFAULT 0,
    "last_pick_at" timestamp with time zone,
    "picks_this_week" integer DEFAULT 0,
    "picks_this_month" integer DEFAULT 0,
    "computed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."capper_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."capper_stats_by_bet_type" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "capper_id" "uuid" NOT NULL,
    "bet_type" "public"."bet_type" NOT NULL,
    "total_picks" integer DEFAULT 0,
    "wins" integer DEFAULT 0,
    "losses" integer DEFAULT 0,
    "pushes" integer DEFAULT 0,
    "win_percentage" numeric(5,2) DEFAULT 0,
    "net_units" numeric(10,2) DEFAULT 0,
    "roi_percentage" numeric(6,2) DEFAULT 0,
    "computed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."capper_stats_by_bet_type" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."capper_stats_by_sport" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "capper_id" "uuid" NOT NULL,
    "sport" "text" NOT NULL,
    "total_picks" integer DEFAULT 0,
    "wins" integer DEFAULT 0,
    "losses" integer DEFAULT 0,
    "pushes" integer DEFAULT 0,
    "win_percentage" numeric(5,2) DEFAULT 0,
    "net_units" numeric(10,2) DEFAULT 0,
    "roi_percentage" numeric(6,2) DEFAULT 0,
    "computed_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "capper_stats_by_sport_sport_check" CHECK (("sport" = ANY (ARRAY['NFL'::"text", 'NBA'::"text", 'NHL'::"text", 'MLB'::"text", 'NCAAF'::"text", 'NCAAB'::"text", 'Soccer'::"text", 'Other'::"text"])))
);


ALTER TABLE "public"."capper_stats_by_sport" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cappers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "avatar_emoji" "text" DEFAULT '🎯'::"text",
    "avatar_url" "text",
    "verified" boolean DEFAULT false,
    "capper_type" "text" NOT NULL,
    "network" "text",
    "role" "text",
    "twitter_handle" "text",
    "followers_count" "text",
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "bio" "text",
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cappers_capper_type_check" CHECK (("capper_type" = ANY (ARRAY['celebrity'::"text", 'pro'::"text", 'community'::"text", 'ai'::"text"])))
);


ALTER TABLE "public"."cappers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cron_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_name" character varying(100) NOT NULL,
    "status" character varying(50) DEFAULT 'running'::character varying NOT NULL,
    "result" "jsonb",
    "error_message" "text",
    "duration_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cron_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service" character varying(100) NOT NULL,
    "error" "text" NOT NULL,
    "severity" character varying(20) DEFAULT 'medium'::character varying,
    "stack_trace" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expert_picks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expert_id" "uuid",
    "source" character varying(50) NOT NULL,
    "source_id" character varying(255),
    "source_url" "text",
    "sport" character varying(20) NOT NULL,
    "league" character varying(50),
    "game_id" character varying(100),
    "game_time" timestamp with time zone,
    "home_team" character varying(100),
    "away_team" character varying(100),
    "pick_type" character varying(30) NOT NULL,
    "pick_description" "text" NOT NULL,
    "pick_side" character varying(100),
    "line" numeric(10,2),
    "odds" integer DEFAULT '-110'::integer,
    "stake" numeric(10,2) DEFAULT 1,
    "confidence" integer,
    "result" character varying(20) DEFAULT 'pending'::character varying,
    "actual_result" "text",
    "payout" numeric(10,2),
    "clv" numeric(10,2),
    "picked_at" timestamp with time zone NOT NULL,
    "settled_at" timestamp with time zone,
    "analysis" "text",
    "verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."expert_picks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expert_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" character varying(100) NOT NULL,
    "name" character varying(255) NOT NULL,
    "source" character varying(50) NOT NULL,
    "twitter_handle" character varying(100),
    "avatar_url" "text",
    "network" character varying(100),
    "role" character varying(100),
    "is_tracked" boolean DEFAULT true,
    "sync_frequency" character varying(20) DEFAULT 'daily'::character varying,
    "last_sync_at" timestamp with time zone,
    "followers_count" character varying(20),
    "bio" "text",
    "verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."expert_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expert_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expert_id" "uuid",
    "timeframe" character varying(20) NOT NULL,
    "sport" character varying(20),
    "total_picks" integer DEFAULT 0,
    "wins" integer DEFAULT 0,
    "losses" integer DEFAULT 0,
    "pushes" integer DEFAULT 0,
    "pending" integer DEFAULT 0,
    "win_pct" numeric(5,2),
    "net_units" numeric(10,2),
    "roi_pct" numeric(5,2),
    "avg_odds" integer,
    "clv_avg" numeric(10,2),
    "current_streak" character varying(10),
    "best_streak" character varying(10),
    "worst_streak" character varying(10),
    "rank" integer,
    "rank_change" integer DEFAULT 0,
    "calculated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."expert_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "external_id" "text" NOT NULL,
    "sport" "text" NOT NULL,
    "home_team_id" "uuid",
    "away_team_id" "uuid",
    "venue" "text",
    "scheduled_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text",
    "home_score" integer,
    "away_score" integer,
    "period" "text",
    "week_number" integer,
    "season_year" integer NOT NULL,
    "season_type" "text" DEFAULT 'regular'::"text",
    "broadcast" "text",
    "weather" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "games_season_type_check" CHECK (("season_type" = ANY (ARRAY['preseason'::"text", 'regular'::"text", 'postseason'::"text"]))),
    CONSTRAINT "games_sport_check" CHECK (("sport" = ANY (ARRAY['NFL'::"text", 'NBA'::"text", 'NHL'::"text", 'MLB'::"text"]))),
    CONSTRAINT "games_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'live'::"text", 'final'::"text", 'postponed'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."games" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."historical_edge_picks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pick_date" "date" NOT NULL,
    "sport" "text" NOT NULL,
    "game_id" "uuid",
    "pick_type" "text" NOT NULL,
    "selection" "text" NOT NULL,
    "odds" integer NOT NULL,
    "edge_source" "text" NOT NULL,
    "edge_score" integer,
    "confidence" integer,
    "model_probability" numeric(5,4),
    "implied_probability" numeric(5,4),
    "edge_percentage" numeric(5,2),
    "odds_at_pick" integer,
    "closing_line" integer,
    "clv_cents" integer,
    "beat_close" boolean,
    "result" "text",
    "units_wagered" numeric(4,2) DEFAULT 1.0,
    "units_won_lost" numeric(6,2),
    "supporting_trends" "text"[],
    "public_side" boolean,
    "sharp_side" boolean,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "historical_edge_picks_confidence_check" CHECK ((("confidence" >= 0) AND ("confidence" <= 100))),
    CONSTRAINT "historical_edge_picks_edge_score_check" CHECK ((("edge_score" >= 0) AND ("edge_score" <= 100))),
    CONSTRAINT "historical_edge_picks_edge_source_check" CHECK (("edge_source" = ANY (ARRAY['ai_model'::"text", 'trend'::"text", 'sharp_money'::"text", 'clv'::"text", 'contrarian'::"text", 'situational'::"text", 'value'::"text"]))),
    CONSTRAINT "historical_edge_picks_pick_type_check" CHECK (("pick_type" = ANY (ARRAY['spread'::"text", 'total'::"text", 'moneyline'::"text", 'prop'::"text", 'parlay_leg'::"text", 'puckline'::"text", 'runline'::"text", 'first_half'::"text", 'first_quarter'::"text", 'player_prop'::"text"]))),
    CONSTRAINT "historical_edge_picks_result_check" CHECK (("result" = ANY (ARRAY['win'::"text", 'loss'::"text", 'push'::"text", 'pending'::"text"]))),
    CONSTRAINT "historical_edge_picks_sport_check" CHECK (("sport" = ANY (ARRAY['NFL'::"text", 'NBA'::"text", 'NHL'::"text", 'MLB'::"text", 'NCAAF'::"text", 'NCAAB'::"text"])))
);


ALTER TABLE "public"."historical_edge_picks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."historical_games" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "external_id" "text",
    "sport" "text" NOT NULL,
    "season_year" integer NOT NULL,
    "season_type" "text" DEFAULT 'regular'::"text",
    "week_number" integer,
    "home_team" "text" NOT NULL,
    "away_team" "text" NOT NULL,
    "home_team_abbrev" "text",
    "away_team_abbrev" "text",
    "game_date" timestamp with time zone NOT NULL,
    "venue" "text",
    "is_neutral_site" boolean DEFAULT false,
    "home_score" integer NOT NULL,
    "away_score" integer NOT NULL,
    "open_spread" numeric(5,1),
    "open_total" numeric(5,1),
    "open_home_ml" integer,
    "open_away_ml" integer,
    "close_spread" numeric(5,1),
    "close_total" numeric(5,1),
    "close_home_ml" integer,
    "close_away_ml" integer,
    "spread_result" "text",
    "total_result" "text",
    "home_ml_result" "text",
    "public_spread_home_pct" integer,
    "public_money_home_pct" integer,
    "public_total_over_pct" integer,
    "public_ml_home_pct" integer,
    "home_team_record" "text",
    "away_team_record" "text",
    "rivalry_game" boolean DEFAULT false,
    "primetime_game" boolean DEFAULT false,
    "divisional_game" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "historical_games_home_ml_result_check" CHECK (("home_ml_result" = ANY (ARRAY['win'::"text", 'loss'::"text"]))),
    CONSTRAINT "historical_games_season_type_check" CHECK (("season_type" = ANY (ARRAY['preseason'::"text", 'regular'::"text", 'postseason'::"text"]))),
    CONSTRAINT "historical_games_sport_check" CHECK (("sport" = ANY (ARRAY['NFL'::"text", 'NBA'::"text", 'NHL'::"text", 'MLB'::"text", 'NCAAF'::"text", 'NCAAB'::"text"]))),
    CONSTRAINT "historical_games_spread_result_check" CHECK (("spread_result" = ANY (ARRAY['home_cover'::"text", 'away_cover'::"text", 'push'::"text"]))),
    CONSTRAINT "historical_games_total_result_check" CHECK (("total_result" = ANY (ARRAY['over'::"text", 'under'::"text", 'push'::"text"])))
);


ALTER TABLE "public"."historical_games" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."historical_prediction_markets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "external_id" "text",
    "platform" "text" NOT NULL,
    "market_category" "text" NOT NULL,
    "market_title" "text" NOT NULL,
    "market_description" "text",
    "market_slug" "text",
    "sport" "text",
    "event_name" "text",
    "created_at" timestamp with time zone NOT NULL,
    "resolved_at" timestamp with time zone,
    "resolution_date" timestamp with time zone,
    "resolved" boolean DEFAULT false,
    "resolution" "text",
    "total_volume" numeric(15,2),
    "total_shares_traded" bigint,
    "price_history" "jsonb",
    "initial_yes_price" numeric(5,4),
    "final_yes_price" numeric(5,4),
    "peak_yes_price" numeric(5,4),
    "low_yes_price" numeric(5,4),
    "price_volatility" numeric(5,4),
    "sharpe_ratio" numeric(5,2),
    "our_prediction" "text",
    "our_confidence" integer,
    "our_entry_price" numeric(5,4),
    "our_exit_price" numeric(5,4),
    "our_pnl_pct" numeric(6,2),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "historical_prediction_markets_market_category_check" CHECK (("market_category" = ANY (ARRAY['sports'::"text", 'politics'::"text", 'crypto'::"text", 'entertainment'::"text", 'finance'::"text", 'world_events'::"text", 'elections'::"text"]))),
    CONSTRAINT "historical_prediction_markets_our_confidence_check" CHECK ((("our_confidence" >= 0) AND ("our_confidence" <= 100))),
    CONSTRAINT "historical_prediction_markets_our_prediction_check" CHECK (("our_prediction" = ANY (ARRAY['yes'::"text", 'no'::"text", NULL::"text"]))),
    CONSTRAINT "historical_prediction_markets_platform_check" CHECK (("platform" = ANY (ARRAY['polymarket'::"text", 'kalshi'::"text", 'predictit'::"text", 'metaculus'::"text"]))),
    CONSTRAINT "historical_prediction_markets_resolution_check" CHECK (("resolution" = ANY (ARRAY['yes'::"text", 'no'::"text", 'partial'::"text", 'void'::"text", NULL::"text"]))),
    CONSTRAINT "historical_prediction_markets_sport_check" CHECK (("sport" = ANY (ARRAY['NFL'::"text", 'NBA'::"text", 'NHL'::"text", 'MLB'::"text", 'NCAAF'::"text", 'NCAAB'::"text", 'Soccer'::"text", 'Golf'::"text", 'Tennis'::"text", NULL::"text"])))
);


ALTER TABLE "public"."historical_prediction_markets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."historical_trends" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "trend_id" "text" NOT NULL,
    "sport" "text" NOT NULL,
    "category" "text" NOT NULL,
    "bet_type" "text" NOT NULL,
    "trend_name" "text" NOT NULL,
    "trend_description" "text" NOT NULL,
    "trend_criteria" "jsonb" NOT NULL,
    "l30_record" "text",
    "l30_units" numeric(6,2),
    "l30_roi" numeric(5,2),
    "l30_avg_odds" integer,
    "l90_record" "text",
    "l90_units" numeric(6,2),
    "l90_roi" numeric(5,2),
    "l90_avg_odds" integer,
    "l365_record" "text",
    "l365_units" numeric(6,2),
    "l365_roi" numeric(5,2),
    "l365_avg_odds" integer,
    "all_time_record" "text",
    "all_time_units" numeric(6,2),
    "all_time_roi" numeric(5,2),
    "all_time_avg_odds" integer,
    "all_time_sample_size" integer,
    "is_active" boolean DEFAULT true,
    "hot_streak" boolean DEFAULT false,
    "cold_streak" boolean DEFAULT false,
    "confidence_score" integer,
    "monthly_performance" "jsonb",
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "historical_trends_bet_type_check" CHECK (("bet_type" = ANY (ARRAY['spread'::"text", 'total'::"text", 'moneyline'::"text", 'first_half'::"text", 'first_quarter'::"text"]))),
    CONSTRAINT "historical_trends_category_check" CHECK (("category" = ANY (ARRAY['situational'::"text", 'team'::"text", 'public_fade'::"text", 'sharp'::"text", 'timing'::"text", 'weather'::"text", 'revenge'::"text", 'rest'::"text", 'travel'::"text", 'contrarian'::"text", 'value'::"text"]))),
    CONSTRAINT "historical_trends_confidence_score_check" CHECK ((("confidence_score" >= 0) AND ("confidence_score" <= 100))),
    CONSTRAINT "historical_trends_sport_check" CHECK (("sport" = ANY (ARRAY['NFL'::"text", 'NBA'::"text", 'NHL'::"text", 'MLB'::"text", 'NCAAF'::"text", 'NCAAB'::"text", 'ALL'::"text"])))
);


ALTER TABLE "public"."historical_trends" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."injuries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "external_id" "text",
    "team_id" "uuid",
    "player_name" "text" NOT NULL,
    "player_position" "text",
    "injury_type" "text",
    "status" "text",
    "description" "text",
    "expected_return" "date",
    "impact_rating" integer,
    "reported_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "injuries_impact_rating_check" CHECK ((("impact_rating" >= 1) AND ("impact_rating" <= 5))),
    CONSTRAINT "injuries_status_check" CHECK (("status" = ANY (ARRAY['out'::"text", 'doubtful'::"text", 'questionable'::"text", 'probable'::"text", 'day-to-day'::"text", 'ir'::"text"])))
);


ALTER TABLE "public"."injuries" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."leaderboard" AS
 SELECT "c"."id",
    "c"."slug",
    "c"."name",
    "c"."avatar_emoji",
    "c"."avatar_url",
    "c"."verified",
    "c"."capper_type",
    "c"."network",
    "c"."role",
    "c"."followers_count",
    "cs"."total_picks",
    "cs"."total_wins",
    "cs"."total_losses",
    "cs"."total_pushes",
    "cs"."win_percentage",
    "cs"."net_units",
    "cs"."roi_percentage",
    "cs"."current_streak",
    "cs"."overall_rank",
    "cs"."rank_change",
    "cs"."last_pick_at"
   FROM ("public"."cappers" "c"
     LEFT JOIN "public"."capper_stats" "cs" ON (("c"."id" = "cs"."capper_id")))
  WHERE ("c"."is_active" = true)
  ORDER BY "cs"."net_units" DESC NULLS LAST;


ALTER VIEW "public"."leaderboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_price_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "market_id" "uuid",
    "yes_price" numeric(5,4),
    "no_price" numeric(5,4),
    "volume_24h" numeric(15,2),
    "recorded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."market_price_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."matchup_ai_insights" (
    "id" integer NOT NULL,
    "game_id" "uuid",
    "model_version" "text",
    "prompt" "text",
    "insight_json" "jsonb",
    "insight_text" "text",
    "score" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."matchup_ai_insights" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."matchup_ai_insights_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."matchup_ai_insights_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."matchup_ai_insights_id_seq" OWNED BY "public"."matchup_ai_insights"."id";



CREATE MATERIALIZED VIEW "public"."mv_20year_trend_summary" AS
 SELECT "sport",
    "category",
    "count"(*) AS "trend_count",
    "avg"("all_time_roi") AS "avg_roi",
    "avg"("all_time_sample_size") AS "avg_sample_size",
    "sum"("all_time_units") AS "total_units",
    "avg"("confidence_score") AS "avg_confidence"
   FROM "public"."historical_trends"
  WHERE ("is_active" = true)
  GROUP BY "sport", "category"
  ORDER BY ("avg"("all_time_roi")) DESC
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_20year_trend_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."odds" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "game_id" "uuid",
    "sportsbook" "text" NOT NULL,
    "spread_home" numeric(5,2),
    "spread_away" numeric(5,2),
    "spread_home_odds" integer,
    "spread_away_odds" integer,
    "moneyline_home" integer,
    "moneyline_away" integer,
    "total_line" numeric(5,2),
    "total_over_odds" integer,
    "total_under_odds" integer,
    "fetched_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."odds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."odds_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "game_id" "uuid",
    "sportsbook" "text" NOT NULL,
    "line_type" "text" NOT NULL,
    "old_value" numeric(10,2),
    "new_value" numeric(10,2),
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "odds_history_line_type_check" CHECK (("line_type" = ANY (ARRAY['spread'::"text", 'total'::"text", 'moneyline'::"text"])))
);


ALTER TABLE "public"."odds_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."picks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "capper_id" "uuid" NOT NULL,
    "game_id" "uuid",
    "sport" "text" NOT NULL,
    "event_name" "text",
    "bet_type" "public"."bet_type" NOT NULL,
    "pick_description" "text" NOT NULL,
    "team_picked" "text",
    "spread_line" numeric(5,2),
    "moneyline_odds" integer,
    "total_line" numeric(5,2),
    "over_under" "text",
    "prop_type" "text",
    "prop_player" "text",
    "prop_line" numeric(6,2),
    "parlay_legs" "jsonb",
    "parlay_odds" integer,
    "units" numeric(4,2) DEFAULT 1.0,
    "picked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "game_date" "date",
    "odds_at_pick" integer,
    "source_url" "text",
    "source_type" "text",
    "result" "text",
    "result_notes" "text",
    "settled_at" timestamp with time zone,
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "admin_notes" "text",
    "is_hidden" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "picks_over_under_check" CHECK (("over_under" = ANY (ARRAY['over'::"text", 'under'::"text"]))),
    CONSTRAINT "picks_result_check" CHECK (("result" = ANY (ARRAY['win'::"text", 'loss'::"text", 'push'::"text", 'pending'::"text", 'void'::"text"]))),
    CONSTRAINT "picks_source_type_check" CHECK (("source_type" = ANY (ARRAY['tv'::"text", 'podcast'::"text", 'twitter'::"text", 'article'::"text", 'manual'::"text", 'other'::"text"]))),
    CONSTRAINT "picks_sport_check" CHECK (("sport" = ANY (ARRAY['NFL'::"text", 'NBA'::"text", 'NHL'::"text", 'MLB'::"text", 'NCAAF'::"text", 'NCAAB'::"text", 'Soccer'::"text", 'Other'::"text"])))
);


ALTER TABLE "public"."picks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" integer NOT NULL,
    "sport" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "short_name" "text",
    "team_id" integer,
    "position" "text",
    "jersey_number" "text",
    "external_ids" "jsonb" DEFAULT '{}'::"jsonb",
    "alternate_names" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."players" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."players_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."players_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."players_id_seq" OWNED BY "public"."players"."id";



CREATE TABLE IF NOT EXISTS "public"."prediction_markets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "external_id" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "subcategory" "text",
    "image_url" "text",
    "status" "text" DEFAULT 'open'::"text",
    "resolution" "text",
    "end_date" timestamp with time zone,
    "volume" numeric(15,2),
    "liquidity" numeric(15,2),
    "yes_price" numeric(5,4),
    "no_price" numeric(5,4),
    "num_traders" integer,
    "is_sports_related" boolean DEFAULT false,
    "related_game_id" "uuid",
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "prediction_markets_platform_check" CHECK (("platform" = ANY (ARRAY['polymarket'::"text", 'kalshi'::"text"]))),
    CONSTRAINT "prediction_markets_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'closed'::"text", 'resolved'::"text"])))
);


ALTER TABLE "public"."prediction_markets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "username" "text",
    "full_name" "text",
    "avatar_url" "text",
    "subscription_tier" "text" DEFAULT 'free'::"text",
    "subscription_status" "text" DEFAULT 'active'::"text",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "preferences" "jsonb" DEFAULT '{"theme": "dark", "notifications": true, "favoriteSports": ["NFL", "NBA"]}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" character varying(50) DEFAULT 'user'::character varying,
    "is_admin" boolean DEFAULT false,
    CONSTRAINT "profiles_subscription_status_check" CHECK (("subscription_status" = ANY (ARRAY['active'::"text", 'canceled'::"text", 'past_due'::"text"]))),
    CONSTRAINT "profiles_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['free'::"text", 'pro'::"text", 'premium'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."record_modifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "capper_id" "uuid",
    "pick_id" "uuid",
    "modification_type" "text" NOT NULL,
    "field_changed" "text",
    "old_value" "text",
    "new_value" "text",
    "reason" "text",
    "modified_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "record_modifications_modification_type_check" CHECK (("modification_type" = ANY (ARRAY['add_pick'::"text", 'edit_pick'::"text", 'delete_pick'::"text", 'change_result'::"text", 'bulk_update'::"text", 'manual_adjustment'::"text"])))
);


ALTER TABLE "public"."record_modifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."share_cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expert_id" "uuid",
    "timeframe" character varying(20) NOT NULL,
    "sport" character varying(20),
    "image_url" "text",
    "share_text" "text" NOT NULL,
    "view_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "click_count" integer DEFAULT 0,
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."share_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "ads_enabled" boolean DEFAULT false,
    "ads_header_enabled" boolean DEFAULT true,
    "ads_sidebar_enabled" boolean DEFAULT true,
    "ads_inline_enabled" boolean DEFAULT true,
    "ads_footer_enabled" boolean DEFAULT true,
    "adsense_publisher_id" character varying(50) DEFAULT NULL::character varying,
    "adsense_slot_header" character varying(20) DEFAULT NULL::character varying,
    "adsense_slot_sidebar" character varying(20) DEFAULT NULL::character varying,
    "adsense_slot_inline" character varying(20) DEFAULT NULL::character varying,
    "adsense_slot_footer" character varying(20) DEFAULT NULL::character varying,
    "maintenance_mode" boolean DEFAULT false,
    "auto_refresh_enabled" boolean DEFAULT true,
    "auto_refresh_interval_minutes" integer DEFAULT 15,
    "ai_analysis_enabled" boolean DEFAULT true,
    "live_scores_enabled" boolean DEFAULT true,
    "notification_emails" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "single_row" CHECK (("id" = 1))
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_followers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "system_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notifications_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_followers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_performance_summary" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "period_type" "text" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "sport" "text",
    "edge_total_picks" integer DEFAULT 0,
    "edge_wins" integer DEFAULT 0,
    "edge_losses" integer DEFAULT 0,
    "edge_pushes" integer DEFAULT 0,
    "edge_win_rate" numeric(5,2),
    "edge_units" numeric(8,2),
    "edge_roi" numeric(5,2),
    "edge_avg_odds" integer,
    "edge_clv_avg" numeric(5,2),
    "trend_total_picks" integer DEFAULT 0,
    "trend_wins" integer DEFAULT 0,
    "trend_losses" integer DEFAULT 0,
    "trend_win_rate" numeric(5,2),
    "trend_units" numeric(8,2),
    "trend_roi" numeric(5,2),
    "pm_total_markets" integer DEFAULT 0,
    "pm_correct" integer DEFAULT 0,
    "pm_roi" numeric(5,2),
    "current_streak" integer DEFAULT 0,
    "best_streak" integer DEFAULT 0,
    "worst_streak" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "system_performance_summary_period_type_check" CHECK (("period_type" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text", 'quarterly'::"text", 'yearly'::"text", 'all_time'::"text"]))),
    CONSTRAINT "system_performance_summary_sport_check" CHECK (("sport" = ANY (ARRAY['NFL'::"text", 'NBA'::"text", 'NHL'::"text", 'MLB'::"text", 'NCAAF'::"text", 'NCAAB'::"text", 'ALL'::"text"])))
);


ALTER TABLE "public"."system_performance_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_picks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "system_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "game_id" "text",
    "game_date" "date" NOT NULL,
    "matchup" "text" NOT NULL,
    "pick" "text" NOT NULL,
    "odds" integer DEFAULT '-110'::integer,
    "confidence" integer,
    "result" "text",
    "profit" numeric(10,2),
    "picked_at" timestamp with time zone DEFAULT "now"(),
    "settled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "system_picks_confidence_check" CHECK ((("confidence" >= 1) AND ("confidence" <= 100))),
    CONSTRAINT "system_picks_result_check" CHECK (("result" = ANY (ARRAY['pending'::"text", 'win'::"text", 'loss'::"text", 'push'::"text", 'void'::"text"])))
);


ALTER TABLE "public"."system_picks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_records" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_id" "uuid",
    "season_year" integer NOT NULL,
    "wins" integer DEFAULT 0,
    "losses" integer DEFAULT 0,
    "ties" integer DEFAULT 0,
    "ats_wins" integer DEFAULT 0,
    "ats_losses" integer DEFAULT 0,
    "ats_pushes" integer DEFAULT 0,
    "over_wins" integer DEFAULT 0,
    "under_wins" integer DEFAULT 0,
    "ou_pushes" integer DEFAULT 0,
    "home_ats_wins" integer DEFAULT 0,
    "home_ats_losses" integer DEFAULT 0,
    "away_ats_wins" integer DEFAULT 0,
    "away_ats_losses" integer DEFAULT 0,
    "favorite_ats_wins" integer DEFAULT 0,
    "favorite_ats_losses" integer DEFAULT 0,
    "underdog_ats_wins" integer DEFAULT 0,
    "underdog_ats_losses" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" integer NOT NULL,
    "sport" "text" NOT NULL,
    "team_name" "text" NOT NULL,
    "abbrev" "text",
    "alternate_names" "jsonb" DEFAULT '[]'::"jsonb",
    "external_ids" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."teams_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."teams_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."teams_id_seq" OWNED BY "public"."teams"."id";



CREATE TABLE IF NOT EXISTS "public"."twitter_sync_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expert_id" "uuid",
    "twitter_handle" character varying(100) NOT NULL,
    "tweets_fetched" integer DEFAULT 0,
    "picks_extracted" integer DEFAULT 0,
    "last_tweet_id" character varying(100),
    "status" character varying(20) DEFAULT 'success'::character varying,
    "error_message" "text",
    "synced_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."twitter_sync_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_bets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sport" "text" NOT NULL,
    "game_id" "text",
    "bet_type" "text" NOT NULL,
    "selection" "text" NOT NULL,
    "odds" integer NOT NULL,
    "stake" numeric(10,2) NOT NULL,
    "potential_payout" numeric(10,2),
    "actual_payout" numeric(10,2),
    "status" "text" DEFAULT 'pending'::"text",
    "parlay_legs" "jsonb" DEFAULT '[]'::"jsonb",
    "sportsbook" "text",
    "notes" "text",
    "confidence" integer,
    "tags" "text"[],
    "placed_at" timestamp with time zone DEFAULT "now"(),
    "settled_at" timestamp with time zone,
    "game_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_bets_bet_type_check" CHECK (("bet_type" = ANY (ARRAY['spread'::"text", 'moneyline'::"text", 'total'::"text", 'prop'::"text", 'parlay'::"text", 'teaser'::"text", 'future'::"text", 'live'::"text", 'other'::"text"]))),
    CONSTRAINT "user_bets_confidence_check" CHECK ((("confidence" >= 1) AND ("confidence" <= 5))),
    CONSTRAINT "user_bets_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'won'::"text", 'lost'::"text", 'push'::"text", 'cashout'::"text", 'void'::"text"])))
);


ALTER TABLE "public"."user_bets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_favorite_teams" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "sport" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "team_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_favorite_teams_sport_check" CHECK (("sport" = ANY (ARRAY['NFL'::"text", 'NBA'::"text", 'NHL'::"text", 'MLB'::"text"])))
);


ALTER TABLE "public"."user_favorite_teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "follow_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "entity_name" "text" NOT NULL,
    "entity_data" "jsonb" DEFAULT '{}'::"jsonb",
    "notifications_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_follows_follow_type_check" CHECK (("follow_type" = ANY (ARRAY['player'::"text", 'team'::"text", 'expert'::"text", 'market'::"text"])))
);


ALTER TABLE "public"."user_follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_picks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "game_id" "uuid",
    "market_id" "uuid",
    "pick_type" "text" NOT NULL,
    "pick_value" "text" NOT NULL,
    "odds_at_pick" integer,
    "stake" numeric(10,2),
    "result" "text",
    "payout" numeric(10,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_picks_result_check" CHECK (("result" = ANY (ARRAY['win'::"text", 'loss'::"text", 'push'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."user_picks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "user_id" "uuid" NOT NULL,
    "default_sport" "text" DEFAULT 'NFL'::"text",
    "odds_format" "text" DEFAULT 'american'::"text",
    "timezone" "text" DEFAULT 'America/New_York'::"text",
    "dashboard_layout" "jsonb" DEFAULT '{"widgets": ["recent_bets", "followed_games", "analytics_summary"]}'::"jsonb",
    "email_notifications" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT false,
    "notify_game_start" boolean DEFAULT true,
    "notify_bet_result" boolean DEFAULT true,
    "notify_followed_picks" boolean DEFAULT true,
    "starting_bankroll" numeric(10,2) DEFAULT 1000.00,
    "current_bankroll" numeric(10,2) DEFAULT 1000.00,
    "unit_size" numeric(10,2) DEFAULT 100.00,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_preferences_odds_format_check" CHECK (("odds_format" = ANY (ARRAY['american'::"text", 'decimal'::"text", 'fractional'::"text"])))
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_systems" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "sport" "text" NOT NULL,
    "bet_type" "text" NOT NULL,
    "criteria" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "custom_prompt" "text",
    "situation_filters" "jsonb" DEFAULT '[]'::"jsonb",
    "backtest_results" "jsonb" DEFAULT '{}'::"jsonb",
    "backtest_completed_at" timestamp with time zone,
    "stats" "jsonb" DEFAULT '{"clv": 0, "roi": 0, "units": 0, "record": "0-0-0", "winPct": 0, "avgOdds": -110, "kellyPct": 0, "maxDrawdown": 0, "sharpeRatio": 0}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "is_public" boolean DEFAULT false,
    "followers_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_systems_bet_type_check" CHECK (("bet_type" = ANY (ARRAY['ats'::"text", 'ml'::"text", 'ou'::"text", 'all'::"text"]))),
    CONSTRAINT "user_systems_sport_check" CHECK (("sport" = ANY (ARRAY['all'::"text", 'nfl'::"text", 'nba'::"text", 'nhl'::"text", 'mlb'::"text", 'ncaaf'::"text", 'ncaab'::"text"])))
);


ALTER TABLE "public"."user_systems" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_active_hot_trends" AS
 SELECT "trend_id",
    "sport",
    "category",
    "bet_type",
    "trend_name",
    "trend_description",
    "l30_record",
    "l30_roi",
    "l90_roi",
    "all_time_roi",
    "all_time_sample_size",
    "confidence_score",
    "hot_streak"
   FROM "public"."historical_trends"
  WHERE ("is_active" = true)
  ORDER BY "confidence_score" DESC, "l30_roi" DESC;


ALTER VIEW "public"."v_active_hot_trends" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_prediction_market_performance" AS
 SELECT "platform",
    "market_category",
    "count"(*) AS "total_markets",
    "count"(*) FILTER (WHERE ("resolved" = true)) AS "resolved_markets",
    "count"(*) FILTER (WHERE (("resolution" = 'yes'::"text") AND ("our_prediction" = 'yes'::"text"))) AS "correct_yes",
    "count"(*) FILTER (WHERE (("resolution" = 'no'::"text") AND ("our_prediction" = 'no'::"text"))) AS "correct_no",
    "round"("avg"("our_pnl_pct") FILTER (WHERE ("our_pnl_pct" IS NOT NULL)), 2) AS "avg_roi",
    "round"(("sum"("total_volume") / (1000000)::numeric), 2) AS "total_volume_millions"
   FROM "public"."historical_prediction_markets"
  GROUP BY "platform", "market_category";


ALTER VIEW "public"."v_prediction_market_performance" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_system_performance_by_sport" AS
 SELECT "sport",
    "edge_total_picks" AS "total_picks",
    "edge_wins" AS "wins",
    "edge_losses" AS "losses",
    "edge_win_rate" AS "win_rate",
    "edge_units" AS "total_units",
    "edge_roi" AS "roi",
    "edge_clv_avg" AS "avg_clv",
    "pm_total_markets" AS "markets_tracked",
    "pm_correct" AS "correct_predictions",
    "pm_roi" AS "prediction_roi"
   FROM "public"."system_performance_summary"
  WHERE (("period_type" = 'all_time'::"text") AND ("sport" <> 'ALL'::"text"));


ALTER VIEW "public"."v_system_performance_by_sport" OWNER TO "postgres";


ALTER TABLE ONLY "public"."matchup_ai_insights" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."matchup_ai_insights_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."players" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."players_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."teams" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."teams_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_picks"
    ADD CONSTRAINT "ai_picks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."betting_splits"
    ADD CONSTRAINT "betting_splits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."capper_stats_by_bet_type"
    ADD CONSTRAINT "capper_stats_by_bet_type_capper_id_bet_type_key" UNIQUE ("capper_id", "bet_type");



ALTER TABLE ONLY "public"."capper_stats_by_bet_type"
    ADD CONSTRAINT "capper_stats_by_bet_type_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."capper_stats_by_sport"
    ADD CONSTRAINT "capper_stats_by_sport_capper_id_sport_key" UNIQUE ("capper_id", "sport");



ALTER TABLE ONLY "public"."capper_stats_by_sport"
    ADD CONSTRAINT "capper_stats_by_sport_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."capper_stats"
    ADD CONSTRAINT "capper_stats_capper_id_key" UNIQUE ("capper_id");



ALTER TABLE ONLY "public"."capper_stats"
    ADD CONSTRAINT "capper_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cappers"
    ADD CONSTRAINT "cappers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cappers"
    ADD CONSTRAINT "cappers_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."cron_logs"
    ADD CONSTRAINT "cron_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expert_picks"
    ADD CONSTRAINT "expert_picks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expert_profiles"
    ADD CONSTRAINT "expert_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expert_profiles"
    ADD CONSTRAINT "expert_profiles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."expert_stats"
    ADD CONSTRAINT "expert_stats_expert_id_timeframe_sport_key" UNIQUE ("expert_id", "timeframe", "sport");



ALTER TABLE ONLY "public"."expert_stats"
    ADD CONSTRAINT "expert_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_external_id_key" UNIQUE ("external_id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historical_edge_picks"
    ADD CONSTRAINT "historical_edge_picks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historical_games"
    ADD CONSTRAINT "historical_games_external_id_key" UNIQUE ("external_id");



ALTER TABLE ONLY "public"."historical_games"
    ADD CONSTRAINT "historical_games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historical_prediction_markets"
    ADD CONSTRAINT "historical_prediction_markets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historical_trends"
    ADD CONSTRAINT "historical_trends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historical_trends"
    ADD CONSTRAINT "historical_trends_trend_id_key" UNIQUE ("trend_id");



ALTER TABLE ONLY "public"."injuries"
    ADD CONSTRAINT "injuries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_price_history"
    ADD CONSTRAINT "market_price_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matchup_ai_insights"
    ADD CONSTRAINT "matchup_ai_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."odds"
    ADD CONSTRAINT "odds_game_id_sportsbook_fetched_at_key" UNIQUE ("game_id", "sportsbook", "fetched_at");



ALTER TABLE ONLY "public"."odds_history"
    ADD CONSTRAINT "odds_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."odds"
    ADD CONSTRAINT "odds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."picks"
    ADD CONSTRAINT "picks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prediction_markets"
    ADD CONSTRAINT "prediction_markets_external_id_platform_key" UNIQUE ("external_id", "platform");



ALTER TABLE ONLY "public"."prediction_markets"
    ADD CONSTRAINT "prediction_markets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."record_modifications"
    ADD CONSTRAINT "record_modifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."share_cards"
    ADD CONSTRAINT "share_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_followers"
    ADD CONSTRAINT "system_followers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_followers"
    ADD CONSTRAINT "system_followers_system_id_user_id_key" UNIQUE ("system_id", "user_id");



ALTER TABLE ONLY "public"."system_performance_summary"
    ADD CONSTRAINT "system_performance_summary_period_type_period_start_sport_key" UNIQUE ("period_type", "period_start", "sport");



ALTER TABLE ONLY "public"."system_performance_summary"
    ADD CONSTRAINT "system_performance_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_picks"
    ADD CONSTRAINT "system_picks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_records"
    ADD CONSTRAINT "team_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_records"
    ADD CONSTRAINT "team_records_team_id_season_year_key" UNIQUE ("team_id", "season_year");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."twitter_sync_log"
    ADD CONSTRAINT "twitter_sync_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_bets"
    ADD CONSTRAINT "user_bets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_favorite_teams"
    ADD CONSTRAINT "user_favorite_teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_favorite_teams"
    ADD CONSTRAINT "user_favorite_teams_user_id_sport_team_id_key" UNIQUE ("user_id", "sport", "team_id");



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_user_id_follow_type_entity_id_key" UNIQUE ("user_id", "follow_type", "entity_id");



ALTER TABLE ONLY "public"."user_picks"
    ADD CONSTRAINT "user_picks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_systems"
    ADD CONSTRAINT "user_systems_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_ai_picks_best_bet" ON "public"."ai_picks" USING "btree" ("is_best_bet") WHERE ("is_best_bet" = true);



CREATE INDEX "idx_ai_picks_game" ON "public"."ai_picks" USING "btree" ("game_id");



CREATE INDEX "idx_ai_picks_result" ON "public"."ai_picks" USING "btree" ("result");



CREATE INDEX "idx_betting_splits_game" ON "public"."betting_splits" USING "btree" ("game_id");



CREATE INDEX "idx_capper_stats_bet_type_capper" ON "public"."capper_stats_by_bet_type" USING "btree" ("capper_id");



CREATE INDEX "idx_capper_stats_rank" ON "public"."capper_stats" USING "btree" ("overall_rank");



CREATE INDEX "idx_capper_stats_sport_capper" ON "public"."capper_stats_by_sport" USING "btree" ("capper_id");



CREATE INDEX "idx_capper_stats_units" ON "public"."capper_stats" USING "btree" ("net_units" DESC);



CREATE INDEX "idx_cappers_active" ON "public"."cappers" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_cappers_network" ON "public"."cappers" USING "btree" ("network");



CREATE INDEX "idx_cappers_slug" ON "public"."cappers" USING "btree" ("slug");



CREATE INDEX "idx_cappers_type" ON "public"."cappers" USING "btree" ("capper_type");



CREATE INDEX "idx_cron_logs_created_at" ON "public"."cron_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_cron_logs_job_name" ON "public"."cron_logs" USING "btree" ("job_name");



CREATE INDEX "idx_error_logs_created_at" ON "public"."error_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_error_logs_severity" ON "public"."error_logs" USING "btree" ("severity");



CREATE INDEX "idx_expert_picks_expert_id" ON "public"."expert_picks" USING "btree" ("expert_id");



CREATE INDEX "idx_expert_picks_game_time" ON "public"."expert_picks" USING "btree" ("game_time");



CREATE INDEX "idx_expert_picks_picked_at" ON "public"."expert_picks" USING "btree" ("picked_at" DESC);



CREATE INDEX "idx_expert_picks_result" ON "public"."expert_picks" USING "btree" ("result");



CREATE INDEX "idx_expert_picks_source" ON "public"."expert_picks" USING "btree" ("source");



CREATE INDEX "idx_expert_picks_sport" ON "public"."expert_picks" USING "btree" ("sport");



CREATE INDEX "idx_expert_profiles_slug" ON "public"."expert_profiles" USING "btree" ("slug");



CREATE INDEX "idx_expert_profiles_source" ON "public"."expert_profiles" USING "btree" ("source");



CREATE INDEX "idx_expert_profiles_twitter" ON "public"."expert_profiles" USING "btree" ("twitter_handle");



CREATE INDEX "idx_expert_stats_expert_timeframe" ON "public"."expert_stats" USING "btree" ("expert_id", "timeframe");



CREATE INDEX "idx_expert_stats_rank" ON "public"."expert_stats" USING "btree" ("rank");



CREATE INDEX "idx_games_scheduled" ON "public"."games" USING "btree" ("scheduled_at");



CREATE INDEX "idx_games_sport" ON "public"."games" USING "btree" ("sport");



CREATE INDEX "idx_games_sport_date" ON "public"."games" USING "btree" ("sport", "scheduled_at");



CREATE INDEX "idx_games_status" ON "public"."games" USING "btree" ("status");



CREATE INDEX "idx_hist_edge_date" ON "public"."historical_edge_picks" USING "btree" ("pick_date");



CREATE INDEX "idx_hist_edge_result" ON "public"."historical_edge_picks" USING "btree" ("result");



CREATE INDEX "idx_hist_edge_source" ON "public"."historical_edge_picks" USING "btree" ("edge_source");



CREATE INDEX "idx_hist_edge_sport" ON "public"."historical_edge_picks" USING "btree" ("sport");



CREATE INDEX "idx_hist_games_date" ON "public"."historical_games" USING "btree" ("game_date");



CREATE INDEX "idx_hist_games_season" ON "public"."historical_games" USING "btree" ("season_year", "sport");



CREATE INDEX "idx_hist_games_sport" ON "public"."historical_games" USING "btree" ("sport");



CREATE INDEX "idx_hist_games_teams" ON "public"."historical_games" USING "btree" ("home_team", "away_team");



CREATE INDEX "idx_hist_pm_category" ON "public"."historical_prediction_markets" USING "btree" ("market_category");



CREATE INDEX "idx_hist_pm_platform" ON "public"."historical_prediction_markets" USING "btree" ("platform");



CREATE INDEX "idx_hist_pm_resolved" ON "public"."historical_prediction_markets" USING "btree" ("resolved");



CREATE INDEX "idx_hist_pm_sport" ON "public"."historical_prediction_markets" USING "btree" ("sport");



CREATE INDEX "idx_hist_trends_active" ON "public"."historical_trends" USING "btree" ("is_active");



CREATE INDEX "idx_hist_trends_category" ON "public"."historical_trends" USING "btree" ("category");



CREATE INDEX "idx_hist_trends_sport" ON "public"."historical_trends" USING "btree" ("sport");



CREATE INDEX "idx_injuries_status" ON "public"."injuries" USING "btree" ("status");



CREATE INDEX "idx_injuries_team" ON "public"."injuries" USING "btree" ("team_id");



CREATE INDEX "idx_market_price_history_market" ON "public"."market_price_history" USING "btree" ("market_id");



CREATE INDEX "idx_market_price_history_time" ON "public"."market_price_history" USING "btree" ("recorded_at");



CREATE UNIQUE INDEX "idx_mv_20year_sport_cat" ON "public"."mv_20year_trend_summary" USING "btree" ("sport", "category");



CREATE INDEX "idx_odds_game" ON "public"."odds" USING "btree" ("game_id");



CREATE INDEX "idx_odds_history_game" ON "public"."odds_history" USING "btree" ("game_id");



CREATE INDEX "idx_odds_sportsbook" ON "public"."odds" USING "btree" ("sportsbook");



CREATE INDEX "idx_picks_bet_type" ON "public"."picks" USING "btree" ("bet_type");



CREATE INDEX "idx_picks_capper" ON "public"."picks" USING "btree" ("capper_id");



CREATE INDEX "idx_picks_capper_sport" ON "public"."picks" USING "btree" ("capper_id", "sport");



CREATE INDEX "idx_picks_capper_type" ON "public"."picks" USING "btree" ("capper_id", "bet_type");



CREATE INDEX "idx_picks_date" ON "public"."picks" USING "btree" ("picked_at");



CREATE INDEX "idx_picks_game" ON "public"."picks" USING "btree" ("game_id");



CREATE INDEX "idx_picks_result" ON "public"."picks" USING "btree" ("result");



CREATE INDEX "idx_picks_sport" ON "public"."picks" USING "btree" ("sport");



CREATE UNIQUE INDEX "idx_players_sport_name" ON "public"."players" USING "btree" ("sport", "full_name");



CREATE INDEX "idx_prediction_markets_category" ON "public"."prediction_markets" USING "btree" ("category");



CREATE INDEX "idx_prediction_markets_platform" ON "public"."prediction_markets" USING "btree" ("platform");



CREATE INDEX "idx_prediction_markets_sports" ON "public"."prediction_markets" USING "btree" ("is_sports_related") WHERE ("is_sports_related" = true);



CREATE INDEX "idx_prediction_markets_status" ON "public"."prediction_markets" USING "btree" ("status");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_record_mods_capper" ON "public"."record_modifications" USING "btree" ("capper_id");



CREATE INDEX "idx_record_mods_pick" ON "public"."record_modifications" USING "btree" ("pick_id");



CREATE INDEX "idx_system_followers_system" ON "public"."system_followers" USING "btree" ("system_id");



CREATE INDEX "idx_system_followers_user" ON "public"."system_followers" USING "btree" ("user_id");



CREATE INDEX "idx_system_picks_date" ON "public"."system_picks" USING "btree" ("game_date" DESC);



CREATE INDEX "idx_system_picks_result" ON "public"."system_picks" USING "btree" ("result");



CREATE INDEX "idx_system_picks_system" ON "public"."system_picks" USING "btree" ("system_id");



CREATE INDEX "idx_system_picks_user" ON "public"."system_picks" USING "btree" ("user_id");



CREATE INDEX "idx_team_records_team" ON "public"."team_records" USING "btree" ("team_id");



CREATE UNIQUE INDEX "idx_teams_sport_abbrev" ON "public"."teams" USING "btree" ("sport", "abbrev");



CREATE INDEX "idx_user_bets_game_date" ON "public"."user_bets" USING "btree" ("game_date");



CREATE INDEX "idx_user_bets_placed" ON "public"."user_bets" USING "btree" ("placed_at" DESC);



CREATE INDEX "idx_user_bets_sport" ON "public"."user_bets" USING "btree" ("sport");



CREATE INDEX "idx_user_bets_status" ON "public"."user_bets" USING "btree" ("status");



CREATE INDEX "idx_user_bets_type" ON "public"."user_bets" USING "btree" ("bet_type");



CREATE INDEX "idx_user_bets_user" ON "public"."user_bets" USING "btree" ("user_id");



CREATE INDEX "idx_user_follows_entity" ON "public"."user_follows" USING "btree" ("entity_id");



CREATE INDEX "idx_user_follows_type" ON "public"."user_follows" USING "btree" ("follow_type");



CREATE INDEX "idx_user_follows_user" ON "public"."user_follows" USING "btree" ("user_id");



CREATE INDEX "idx_user_picks_result" ON "public"."user_picks" USING "btree" ("result");



CREATE INDEX "idx_user_picks_user" ON "public"."user_picks" USING "btree" ("user_id");



CREATE INDEX "idx_user_systems_active" ON "public"."user_systems" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_user_systems_public" ON "public"."user_systems" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_user_systems_sport" ON "public"."user_systems" USING "btree" ("sport");



CREATE INDEX "idx_user_systems_user" ON "public"."user_systems" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "on_pick_settled" AFTER UPDATE ON "public"."system_picks" FOR EACH ROW EXECUTE FUNCTION "public"."on_system_pick_settled"();



CREATE OR REPLACE TRIGGER "on_profile_created" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_profile"();



CREATE OR REPLACE TRIGGER "on_system_follower_change" AFTER INSERT OR DELETE ON "public"."system_followers" FOR EACH ROW EXECUTE FUNCTION "public"."update_system_followers_count"();



CREATE OR REPLACE TRIGGER "picks_stats_update" AFTER INSERT OR DELETE OR UPDATE ON "public"."picks" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_capper_stats"();



CREATE OR REPLACE TRIGGER "trg_update_expert_stats" AFTER UPDATE OF "result" ON "public"."expert_picks" FOR EACH ROW WHEN (((("old"."result")::"text" = 'pending'::"text") AND (("new"."result")::"text" = ANY ((ARRAY['win'::character varying, 'loss'::character varying, 'push'::character varying])::"text"[])))) EXECUTE FUNCTION "public"."update_expert_stats_on_pick"();



CREATE OR REPLACE TRIGGER "update_games_updated_at" BEFORE UPDATE ON "public"."games" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_injuries_updated_at" BEFORE UPDATE ON "public"."injuries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_prediction_markets_updated_at" BEFORE UPDATE ON "public"."prediction_markets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."ai_picks"
    ADD CONSTRAINT "ai_picks_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."betting_splits"
    ADD CONSTRAINT "betting_splits_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."capper_stats_by_bet_type"
    ADD CONSTRAINT "capper_stats_by_bet_type_capper_id_fkey" FOREIGN KEY ("capper_id") REFERENCES "public"."cappers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."capper_stats_by_sport"
    ADD CONSTRAINT "capper_stats_by_sport_capper_id_fkey" FOREIGN KEY ("capper_id") REFERENCES "public"."cappers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."capper_stats"
    ADD CONSTRAINT "capper_stats_capper_id_fkey" FOREIGN KEY ("capper_id") REFERENCES "public"."cappers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expert_picks"
    ADD CONSTRAINT "expert_picks_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."expert_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expert_stats"
    ADD CONSTRAINT "expert_stats_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."expert_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."historical_edge_picks"
    ADD CONSTRAINT "historical_edge_picks_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."historical_games"("id");



ALTER TABLE ONLY "public"."market_price_history"
    ADD CONSTRAINT "market_price_history_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."prediction_markets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."odds"
    ADD CONSTRAINT "odds_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."odds_history"
    ADD CONSTRAINT "odds_history_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."picks"
    ADD CONSTRAINT "picks_capper_id_fkey" FOREIGN KEY ("capper_id") REFERENCES "public"."cappers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."picks"
    ADD CONSTRAINT "picks_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."picks"
    ADD CONSTRAINT "picks_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id");



ALTER TABLE ONLY "public"."prediction_markets"
    ADD CONSTRAINT "prediction_markets_related_game_id_fkey" FOREIGN KEY ("related_game_id") REFERENCES "public"."games"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."record_modifications"
    ADD CONSTRAINT "record_modifications_capper_id_fkey" FOREIGN KEY ("capper_id") REFERENCES "public"."cappers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."record_modifications"
    ADD CONSTRAINT "record_modifications_modified_by_fkey" FOREIGN KEY ("modified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."record_modifications"
    ADD CONSTRAINT "record_modifications_pick_id_fkey" FOREIGN KEY ("pick_id") REFERENCES "public"."picks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."share_cards"
    ADD CONSTRAINT "share_cards_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."expert_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_followers"
    ADD CONSTRAINT "system_followers_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "public"."user_systems"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_followers"
    ADD CONSTRAINT "system_followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_picks"
    ADD CONSTRAINT "system_picks_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "public"."user_systems"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_picks"
    ADD CONSTRAINT "system_picks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."twitter_sync_log"
    ADD CONSTRAINT "twitter_sync_log_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."expert_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_bets"
    ADD CONSTRAINT "user_bets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_favorite_teams"
    ADD CONSTRAINT "user_favorite_teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_picks"
    ADD CONSTRAINT "user_picks_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id");



ALTER TABLE ONLY "public"."user_picks"
    ADD CONSTRAINT "user_picks_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."prediction_markets"("id");



ALTER TABLE ONLY "public"."user_picks"
    ADD CONSTRAINT "user_picks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_systems"
    ADD CONSTRAINT "user_systems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "AI picks are publicly readable" ON "public"."ai_picks" FOR SELECT USING (true);



CREATE POLICY "Admin write expert_picks" ON "public"."expert_picks" USING (true);



CREATE POLICY "Admin write expert_profiles" ON "public"."expert_profiles" USING (true);



CREATE POLICY "Admin write expert_stats" ON "public"."expert_stats" USING (true);



CREATE POLICY "Admins can manage cappers" ON "public"."cappers" USING (((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text")));



CREATE POLICY "Admins can manage picks" ON "public"."picks" USING (((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text")));



CREATE POLICY "Admins can view modifications" ON "public"."record_modifications" FOR SELECT USING (((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text")));



CREATE POLICY "Betting splits are publicly readable" ON "public"."betting_splits" FOR SELECT USING (true);



CREATE POLICY "Games are publicly readable" ON "public"."games" FOR SELECT USING (true);



CREATE POLICY "Injuries are publicly readable" ON "public"."injuries" FOR SELECT USING (true);



CREATE POLICY "Odds are publicly readable" ON "public"."odds" FOR SELECT USING (true);



CREATE POLICY "Prediction markets are publicly readable" ON "public"."prediction_markets" FOR SELECT USING (true);



CREATE POLICY "Profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public can view bet type stats" ON "public"."capper_stats_by_bet_type" FOR SELECT USING (true);



CREATE POLICY "Public can view cappers" ON "public"."cappers" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can view picks" ON "public"."picks" FOR SELECT USING (("is_hidden" = false));



CREATE POLICY "Public can view sport stats" ON "public"."capper_stats_by_sport" FOR SELECT USING (true);



CREATE POLICY "Public can view stats" ON "public"."capper_stats" FOR SELECT USING (true);



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public read expert_picks" ON "public"."expert_picks" FOR SELECT USING (true);



CREATE POLICY "Public read expert_profiles" ON "public"."expert_profiles" FOR SELECT USING (true);



CREATE POLICY "Public read expert_stats" ON "public"."expert_stats" FOR SELECT USING (true);



CREATE POLICY "Team records are publicly readable" ON "public"."team_records" FOR SELECT USING (true);



CREATE POLICY "Users can delete own bets" ON "public"."user_bets" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own follows" ON "public"."user_follows" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own systems" ON "public"."user_systems" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own favorites" ON "public"."user_favorite_teams" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can follow systems" ON "public"."system_followers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own bets" ON "public"."user_bets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own follows" ON "public"."user_follows" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own systems" ON "public"."user_systems" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert system picks" ON "public"."system_picks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own favorites" ON "public"."user_favorite_teams" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own picks" ON "public"."user_picks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can unfollow systems" ON "public"."system_followers" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own bets" ON "public"."user_bets" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own follows" ON "public"."user_follows" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own preferences" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own systems" ON "public"."user_systems" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update system picks" ON "public"."system_picks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own picks" ON "public"."user_picks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own bets" ON "public"."user_bets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own follows" ON "public"."user_follows" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own preferences" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own systems" ON "public"."user_systems" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("is_public" = true)));



CREATE POLICY "Users can view system followers" ON "public"."system_followers" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view system picks" ON "public"."system_picks" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_systems"
  WHERE (("user_systems"."id" = "system_picks"."system_id") AND ("user_systems"."is_public" = true))))));



CREATE POLICY "Users can view their own favorites" ON "public"."user_favorite_teams" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own picks" ON "public"."user_picks" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."ai_picks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."betting_splits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."capper_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."capper_stats_by_bet_type" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."capper_stats_by_sport" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cappers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expert_picks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expert_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expert_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."injuries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."odds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."picks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prediction_markets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."record_modifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_followers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_picks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_bets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_favorite_teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_picks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_systems" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."calculate_payout"("odds" integer, "stake" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_payout"("odds" integer, "stake" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_payout"("odds" integer, "stake" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_capper_stats"("p_capper_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."compute_capper_stats"("p_capper_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_capper_stats"("p_capper_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_betting_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_betting_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_betting_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."on_system_pick_settled"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_system_pick_settled"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_system_pick_settled"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_capper_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_capper_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_capper_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_expert_stats_on_pick"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_expert_stats_on_pick"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_expert_stats_on_pick"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_system_followers_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_system_followers_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_system_followers_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_system_stats"("p_system_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_system_stats"("p_system_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_system_stats"("p_system_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."ai_picks" TO "anon";
GRANT ALL ON TABLE "public"."ai_picks" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_picks" TO "service_role";



GRANT ALL ON TABLE "public"."betting_splits" TO "anon";
GRANT ALL ON TABLE "public"."betting_splits" TO "authenticated";
GRANT ALL ON TABLE "public"."betting_splits" TO "service_role";



GRANT ALL ON TABLE "public"."capper_stats" TO "anon";
GRANT ALL ON TABLE "public"."capper_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."capper_stats" TO "service_role";



GRANT ALL ON TABLE "public"."capper_stats_by_bet_type" TO "anon";
GRANT ALL ON TABLE "public"."capper_stats_by_bet_type" TO "authenticated";
GRANT ALL ON TABLE "public"."capper_stats_by_bet_type" TO "service_role";



GRANT ALL ON TABLE "public"."capper_stats_by_sport" TO "anon";
GRANT ALL ON TABLE "public"."capper_stats_by_sport" TO "authenticated";
GRANT ALL ON TABLE "public"."capper_stats_by_sport" TO "service_role";



GRANT ALL ON TABLE "public"."cappers" TO "anon";
GRANT ALL ON TABLE "public"."cappers" TO "authenticated";
GRANT ALL ON TABLE "public"."cappers" TO "service_role";



GRANT ALL ON TABLE "public"."cron_logs" TO "anon";
GRANT ALL ON TABLE "public"."cron_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."cron_logs" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."expert_picks" TO "anon";
GRANT ALL ON TABLE "public"."expert_picks" TO "authenticated";
GRANT ALL ON TABLE "public"."expert_picks" TO "service_role";



GRANT ALL ON TABLE "public"."expert_profiles" TO "anon";
GRANT ALL ON TABLE "public"."expert_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."expert_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."expert_stats" TO "anon";
GRANT ALL ON TABLE "public"."expert_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."expert_stats" TO "service_role";



GRANT ALL ON TABLE "public"."games" TO "anon";
GRANT ALL ON TABLE "public"."games" TO "authenticated";
GRANT ALL ON TABLE "public"."games" TO "service_role";



GRANT ALL ON TABLE "public"."historical_edge_picks" TO "anon";
GRANT ALL ON TABLE "public"."historical_edge_picks" TO "authenticated";
GRANT ALL ON TABLE "public"."historical_edge_picks" TO "service_role";



GRANT ALL ON TABLE "public"."historical_games" TO "anon";
GRANT ALL ON TABLE "public"."historical_games" TO "authenticated";
GRANT ALL ON TABLE "public"."historical_games" TO "service_role";



GRANT ALL ON TABLE "public"."historical_prediction_markets" TO "anon";
GRANT ALL ON TABLE "public"."historical_prediction_markets" TO "authenticated";
GRANT ALL ON TABLE "public"."historical_prediction_markets" TO "service_role";



GRANT ALL ON TABLE "public"."historical_trends" TO "anon";
GRANT ALL ON TABLE "public"."historical_trends" TO "authenticated";
GRANT ALL ON TABLE "public"."historical_trends" TO "service_role";



GRANT ALL ON TABLE "public"."injuries" TO "anon";
GRANT ALL ON TABLE "public"."injuries" TO "authenticated";
GRANT ALL ON TABLE "public"."injuries" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboard" TO "anon";
GRANT ALL ON TABLE "public"."leaderboard" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboard" TO "service_role";



GRANT ALL ON TABLE "public"."market_price_history" TO "anon";
GRANT ALL ON TABLE "public"."market_price_history" TO "authenticated";
GRANT ALL ON TABLE "public"."market_price_history" TO "service_role";



GRANT ALL ON TABLE "public"."matchup_ai_insights" TO "anon";
GRANT ALL ON TABLE "public"."matchup_ai_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."matchup_ai_insights" TO "service_role";



GRANT ALL ON SEQUENCE "public"."matchup_ai_insights_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."matchup_ai_insights_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."matchup_ai_insights_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."mv_20year_trend_summary" TO "anon";
GRANT ALL ON TABLE "public"."mv_20year_trend_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."mv_20year_trend_summary" TO "service_role";



GRANT ALL ON TABLE "public"."odds" TO "anon";
GRANT ALL ON TABLE "public"."odds" TO "authenticated";
GRANT ALL ON TABLE "public"."odds" TO "service_role";



GRANT ALL ON TABLE "public"."odds_history" TO "anon";
GRANT ALL ON TABLE "public"."odds_history" TO "authenticated";
GRANT ALL ON TABLE "public"."odds_history" TO "service_role";



GRANT ALL ON TABLE "public"."picks" TO "anon";
GRANT ALL ON TABLE "public"."picks" TO "authenticated";
GRANT ALL ON TABLE "public"."picks" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."prediction_markets" TO "anon";
GRANT ALL ON TABLE "public"."prediction_markets" TO "authenticated";
GRANT ALL ON TABLE "public"."prediction_markets" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."record_modifications" TO "anon";
GRANT ALL ON TABLE "public"."record_modifications" TO "authenticated";
GRANT ALL ON TABLE "public"."record_modifications" TO "service_role";



GRANT ALL ON TABLE "public"."share_cards" TO "anon";
GRANT ALL ON TABLE "public"."share_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."share_cards" TO "service_role";



GRANT ALL ON TABLE "public"."site_settings" TO "anon";
GRANT ALL ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";



GRANT ALL ON TABLE "public"."system_followers" TO "anon";
GRANT ALL ON TABLE "public"."system_followers" TO "authenticated";
GRANT ALL ON TABLE "public"."system_followers" TO "service_role";



GRANT ALL ON TABLE "public"."system_performance_summary" TO "anon";
GRANT ALL ON TABLE "public"."system_performance_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."system_performance_summary" TO "service_role";



GRANT ALL ON TABLE "public"."system_picks" TO "anon";
GRANT ALL ON TABLE "public"."system_picks" TO "authenticated";
GRANT ALL ON TABLE "public"."system_picks" TO "service_role";



GRANT ALL ON TABLE "public"."team_records" TO "anon";
GRANT ALL ON TABLE "public"."team_records" TO "authenticated";
GRANT ALL ON TABLE "public"."team_records" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."twitter_sync_log" TO "anon";
GRANT ALL ON TABLE "public"."twitter_sync_log" TO "authenticated";
GRANT ALL ON TABLE "public"."twitter_sync_log" TO "service_role";



GRANT ALL ON TABLE "public"."user_bets" TO "anon";
GRANT ALL ON TABLE "public"."user_bets" TO "authenticated";
GRANT ALL ON TABLE "public"."user_bets" TO "service_role";



GRANT ALL ON TABLE "public"."user_favorite_teams" TO "anon";
GRANT ALL ON TABLE "public"."user_favorite_teams" TO "authenticated";
GRANT ALL ON TABLE "public"."user_favorite_teams" TO "service_role";



GRANT ALL ON TABLE "public"."user_follows" TO "anon";
GRANT ALL ON TABLE "public"."user_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."user_follows" TO "service_role";



GRANT ALL ON TABLE "public"."user_picks" TO "anon";
GRANT ALL ON TABLE "public"."user_picks" TO "authenticated";
GRANT ALL ON TABLE "public"."user_picks" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_systems" TO "anon";
GRANT ALL ON TABLE "public"."user_systems" TO "authenticated";
GRANT ALL ON TABLE "public"."user_systems" TO "service_role";



GRANT ALL ON TABLE "public"."v_active_hot_trends" TO "anon";
GRANT ALL ON TABLE "public"."v_active_hot_trends" TO "authenticated";
GRANT ALL ON TABLE "public"."v_active_hot_trends" TO "service_role";



GRANT ALL ON TABLE "public"."v_prediction_market_performance" TO "anon";
GRANT ALL ON TABLE "public"."v_prediction_market_performance" TO "authenticated";
GRANT ALL ON TABLE "public"."v_prediction_market_performance" TO "service_role";



GRANT ALL ON TABLE "public"."v_system_performance_by_sport" TO "anon";
GRANT ALL ON TABLE "public"."v_system_performance_by_sport" TO "authenticated";
GRANT ALL ON TABLE "public"."v_system_performance_by_sport" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop trigger if exists "trg_update_expert_stats" on "public"."expert_picks";

CREATE TRIGGER trg_update_expert_stats AFTER UPDATE OF result ON public.expert_picks FOR EACH ROW WHEN ((((old.result)::text = 'pending'::text) AND ((new.result)::text = ANY ((ARRAY['win'::character varying, 'loss'::character varying, 'push'::character varying])::text[])))) EXECUTE FUNCTION public.update_expert_stats_on_pick();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


