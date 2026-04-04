-- Add LiveKit fields to interviews table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pvkxngyfaupqgdhgzmou/sql

ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS livekit_room_name TEXT,
ADD COLUMN IF NOT EXISTS livekit_started_at TIMESTAMPTZ;

-- Add index for faster room lookups
CREATE INDEX IF NOT EXISTS idx_interviews_livekit_room ON interviews(livekit_room_name) WHERE livekit_room_name IS NOT NULL;
