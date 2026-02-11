-- Add x_user_id column to tracked_experts for caching Twitter/X user IDs
-- This saves 1 API call per expert, cutting rate limit usage in half

ALTER TABLE tracked_experts 
ADD COLUMN IF NOT EXISTS x_user_id TEXT;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_tracked_experts_x_user_id ON tracked_experts(x_user_id);

-- Add last_scraped timestamp to track when each expert was last checked
ALTER TABLE tracked_experts 
ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ;

COMMENT ON COLUMN tracked_experts.x_user_id IS 'Cached Twitter/X user ID to avoid lookup API calls';
COMMENT ON COLUMN tracked_experts.last_scraped_at IS 'When this expert was last scraped from X';
