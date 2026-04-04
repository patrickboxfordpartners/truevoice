-- Add latest_scores column to store live AI analysis scores
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pvkxngyfaupqgdhgzmou/sql

ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS latest_scores JSONB DEFAULT '{"speech": 0, "timing": 0, "flow": 0, "linguistic": 0}'::jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_interviews_latest_scores ON interviews USING GIN (latest_scores);
