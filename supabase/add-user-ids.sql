-- Add x_user_id column to tracked_experts if not exists
ALTER TABLE tracked_experts ADD COLUMN IF NOT EXISTS x_user_id TEXT;

-- Known user IDs (can be populated from X API when not rate limited)
-- UPDATE tracked_experts SET x_user_id = 'USER_ID' WHERE x_handle = 'handle';
