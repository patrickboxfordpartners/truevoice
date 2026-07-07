-- supabase/migrations/20260707_report_tokens.sql
create table if not exists report_tokens (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unique(token)
);

alter table report_tokens enable row level security;

-- Authenticated users can create tokens for their own company's interviews
create policy "users can insert tokens for own interviews"
  on report_tokens for insert
  with check (
    exists (
      select 1 from interviews i
      join companies c on c.id = i.company_id
      join profiles p on p.company_id = c.id
      where i.id = interview_id and p.id = auth.uid()
    )
  );

-- Anyone can read a token row by its value (for the public report link)
create policy "public token read"
  on report_tokens for select
  using (true);
