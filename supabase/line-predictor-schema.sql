-- ===========================================
-- LINE PREDICTOR TRACKING SCHEMA
-- Add this to your Supabase SQL Editor
-- ===========================================

-- Line predictions table
CREATE TABLE IF NOT EXISTS public.line_predictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB')),
  bet_type TEXT NOT NULL CHECK (bet_type IN ('spread', 'total', 'moneyline')),
  
  -- Current state when prediction made
  line_at_prediction DECIMAL(5,2) NOT NULL,
  
  -- Prediction details
  predicted_line DECIMAL(5,2) NOT NULL,
  predicted_direction TEXT NOT NULL CHECK (predicted_direction IN ('up', 'down', 'stable')),
  predicted_magnitude DECIMAL(5,2),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  
  -- Optimal timing recommendation
  optimal_timing TEXT CHECK (optimal_timing IN ('now', 'wait', 'avoid')),
  timing_reason TEXT,
  
  -- Factors used (JSONB for flexibility)
  prediction_factors JSONB,
  
  -- Model metadata
  model_version TEXT NOT NULL,
  
  -- Timestamps
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  game_time TIMESTAMPTZ,
  
  -- Actual results (filled in after game)
  actual_closing_line DECIMAL(5,2),
  actual_movement DECIMAL(5,2),
  direction_correct BOOLEAN,
  magnitude_error DECIMAL(5,2),
  settled_at TIMESTAMPTZ
);

CREATE INDEX idx_line_predictions_game ON public.line_predictions(game_id);
CREATE INDEX idx_line_predictions_sport ON public.line_predictions(sport);
CREATE INDEX idx_line_predictions_settled ON public.line_predictions(settled_at);
CREATE INDEX idx_line_predictions_accuracy ON public.line_predictions(direction_correct) WHERE direction_correct IS NOT NULL;

-- Model weights table (for recursive learning)
CREATE TABLE IF NOT EXISTS public.model_weights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  model_version TEXT NOT NULL,
  sport TEXT, -- NULL = global weights, otherwise sport-specific
  weight_name TEXT NOT NULL,
  weight_value DECIMAL(5,4) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_version, sport, weight_name)
);

-- Model performance metrics (computed daily)
CREATE TABLE IF NOT EXISTS public.model_performance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  model_version TEXT NOT NULL,
  sport TEXT, -- NULL = overall, otherwise sport-specific
  date DATE NOT NULL,
  
  -- Performance metrics
  total_predictions INTEGER DEFAULT 0,
  correct_directions INTEGER DEFAULT 0,
  direction_accuracy DECIMAL(5,2),
  avg_magnitude_error DECIMAL(5,2),
  
  -- By confidence level
  high_conf_count INTEGER DEFAULT 0,
  high_conf_accuracy DECIMAL(5,2),
  medium_conf_count INTEGER DEFAULT 0,
  medium_conf_accuracy DECIMAL(5,2),
  low_conf_count INTEGER DEFAULT 0,
  low_conf_accuracy DECIMAL(5,2),
  
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_version, sport, date)
);

CREATE INDEX idx_model_performance_version ON public.model_performance(model_version);
CREATE INDEX idx_model_performance_date ON public.model_performance(date);

-- Enable RLS
ALTER TABLE public.line_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_performance ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Line predictions are publicly readable" ON public.line_predictions FOR SELECT USING (true);
CREATE POLICY "Model weights are publicly readable" ON public.model_weights FOR SELECT USING (true);
CREATE POLICY "Model performance is publicly readable" ON public.model_performance FOR SELECT USING (true);

-- Function to compute daily model performance
CREATE OR REPLACE FUNCTION compute_model_performance(p_date DATE, p_model_version TEXT)
RETURNS void AS $$
BEGIN
  -- Overall performance
  INSERT INTO public.model_performance (
    model_version, sport, date,
    total_predictions, correct_directions, direction_accuracy, avg_magnitude_error,
    high_conf_count, high_conf_accuracy,
    medium_conf_count, medium_conf_accuracy,
    low_conf_count, low_conf_accuracy
  )
  SELECT 
    p_model_version,
    NULL,
    p_date,
    COUNT(*),
    COUNT(*) FILTER (WHERE direction_correct = TRUE),
    ROUND(COUNT(*) FILTER (WHERE direction_correct = TRUE)::decimal / NULLIF(COUNT(*), 0) * 100, 1),
    ROUND(AVG(magnitude_error)::decimal, 2),
    COUNT(*) FILTER (WHERE confidence >= 70),
    ROUND(COUNT(*) FILTER (WHERE confidence >= 70 AND direction_correct = TRUE)::decimal / 
          NULLIF(COUNT(*) FILTER (WHERE confidence >= 70), 0) * 100, 1),
    COUNT(*) FILTER (WHERE confidence >= 50 AND confidence < 70),
    ROUND(COUNT(*) FILTER (WHERE confidence >= 50 AND confidence < 70 AND direction_correct = TRUE)::decimal / 
          NULLIF(COUNT(*) FILTER (WHERE confidence >= 50 AND confidence < 70), 0) * 100, 1),
    COUNT(*) FILTER (WHERE confidence < 50),
    ROUND(COUNT(*) FILTER (WHERE confidence < 50 AND direction_correct = TRUE)::decimal / 
          NULLIF(COUNT(*) FILTER (WHERE confidence < 50), 0) * 100, 1)
  FROM public.line_predictions
  WHERE DATE(settled_at) = p_date
    AND model_version = p_model_version
    AND settled_at IS NOT NULL
  ON CONFLICT (model_version, sport, date) DO UPDATE SET
    total_predictions = EXCLUDED.total_predictions,
    correct_directions = EXCLUDED.correct_directions,
    direction_accuracy = EXCLUDED.direction_accuracy,
    avg_magnitude_error = EXCLUDED.avg_magnitude_error,
    high_conf_count = EXCLUDED.high_conf_count,
    high_conf_accuracy = EXCLUDED.high_conf_accuracy,
    medium_conf_count = EXCLUDED.medium_conf_count,
    medium_conf_accuracy = EXCLUDED.medium_conf_accuracy,
    low_conf_count = EXCLUDED.low_conf_count,
    low_conf_accuracy = EXCLUDED.low_conf_accuracy,
    computed_at = NOW();
    
  -- By sport
  INSERT INTO public.model_performance (
    model_version, sport, date,
    total_predictions, correct_directions, direction_accuracy, avg_magnitude_error
  )
  SELECT 
    p_model_version,
    sport,
    p_date,
    COUNT(*),
    COUNT(*) FILTER (WHERE direction_correct = TRUE),
    ROUND(COUNT(*) FILTER (WHERE direction_correct = TRUE)::decimal / NULLIF(COUNT(*), 0) * 100, 1),
    ROUND(AVG(magnitude_error)::decimal, 2)
  FROM public.line_predictions
  WHERE DATE(settled_at) = p_date
    AND model_version = p_model_version
    AND settled_at IS NOT NULL
  GROUP BY sport
  ON CONFLICT (model_version, sport, date) DO UPDATE SET
    total_predictions = EXCLUDED.total_predictions,
    correct_directions = EXCLUDED.correct_directions,
    direction_accuracy = EXCLUDED.direction_accuracy,
    avg_magnitude_error = EXCLUDED.avg_magnitude_error,
    computed_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Seed initial model weights
INSERT INTO public.model_weights (model_version, sport, weight_name, weight_value) VALUES
('1.0.0', NULL, 'publicBetPctWeight', 0.30),
('1.0.0', NULL, 'moneyPctWeight', 0.50),
('1.0.0', NULL, 'lineMovementMomentum', 0.40),
('1.0.0', NULL, 'sharpActionWeight', 0.70),
('1.0.0', NULL, 'timeToGameWeight', 0.30),
('1.0.0', NULL, 'keyNumberProximity', 0.50),
('1.0.0', 'NFL', 'keyNumberProximity', 0.60), -- NFL key numbers more important
('1.0.0', 'NBA', 'keyNumberProximity', 0.35)  -- NBA key numbers less important
ON CONFLICT (model_version, sport, weight_name) DO NOTHING;
