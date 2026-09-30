#!/bin/bash
# Apply database migration to Supabase

echo "Applying migration: add interview mode..."
npx supabase db push --db-url "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo ""
echo "Migration complete! Run this command to apply:"
echo ""
echo "psql 'postgresql://postgres.pvkxngyfaupqgdhgzmou:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres' < supabase/migrations/00002_add_interview_mode.sql"
echo ""
echo "Or copy/paste the SQL directly into Supabase SQL Editor:"
echo "https://supabase.com/dashboard/project/pvkxngyfaupqgdhgzmou/sql/new"
