-- AuthentiView Database Schema
-- Run this in the Supabase SQL Editor

-- ─── Companies ──────────────────────────────────────────────────────
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  description text,
  industry text,
  company_size text,
  default_duration integer not null default 45,
  feedback_deadline integer not null default 3,
  timezone text not null default 'America/New_York',
  auto_record boolean not null default true,
  authenticity_detection boolean not null default true,
  require_candidate_camera boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Profiles ───────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  company_id uuid references public.companies on delete set null,
  full_name text,
  email text not null,
  role text not null default 'viewer' check (role in ('owner', 'admin', 'editor', 'viewer')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Interviews ─────────────────────────────────────────────────────
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  created_by uuid not null references public.profiles on delete cascade,
  candidate_name text not null,
  candidate_email text not null,
  position text not null,
  scheduled_at timestamptz,
  duration text,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  candidate_token uuid not null default gen_random_uuid(),
  candidate_consented boolean not null default false,
  transcript text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index interviews_candidate_token_idx on public.interviews (candidate_token);

-- ─── Interview Reports ──────────────────────────────────────────────
create table public.interview_reports (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews on delete cascade unique,
  overall_score integer not null default 0,
  speech_score integer not null default 0,
  timing_score integer not null default 0,
  flow_score integer not null default 0,
  linguistic_score integer not null default 0,
  engagement integer not null default 0,
  confidence integer not null default 0,
  summary text,
  recommendations text[],
  created_at timestamptz not null default now()
);

-- ─── Interview Flags ────────────────────────────────────────────────
create table public.interview_flags (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews on delete cascade,
  time text not null,
  pattern text not null,
  severity text not null default 'low' check (severity in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

-- ─── Interview Timeline ─────────────────────────────────────────────
create table public.interview_timeline (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews on delete cascade,
  minute text not null,
  score integer not null,
  created_at timestamptz not null default now()
);

-- ─── Response Delays ────────────────────────────────────────────────
create table public.response_delays (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews on delete cascade,
  question text not null,
  delay real not null,
  label text not null,
  created_at timestamptz not null default now()
);

-- ─── Transcript Chunks ──────────────────────────────────────────────
create table public.transcript_chunks (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews on delete cascade,
  chunk_index integer not null,
  text text not null,
  speaker text,
  elapsed_seconds integer not null,
  speech_score integer,
  timing_score integer,
  flow_score integer,
  linguistic_score integer,
  created_at timestamptz not null default now()
);

-- ─── Email Templates ────────────────────────────────────────────────
create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  template_type text not null check (template_type in ('invitation', 'reminder', 'followup')),
  name text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.interviews enable row level security;
alter table public.interview_reports enable row level security;
alter table public.interview_flags enable row level security;
alter table public.interview_timeline enable row level security;
alter table public.response_delays enable row level security;
alter table public.transcript_chunks enable row level security;
alter table public.email_templates enable row level security;

-- Helper: get current user's company_id
create or replace function public.get_my_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- Companies: members can view their own company
create policy "Users can view own company"
  on public.companies for select
  using (id = public.get_my_company_id());

create policy "Owners/admins can update own company"
  on public.companies for update
  using (id = public.get_my_company_id())
  with check (id = public.get_my_company_id());

create policy "Authenticated users can insert companies"
  on public.companies for insert
  to authenticated
  with check (true);

-- Profiles: users can see their own company's team
create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid() or company_id = public.get_my_company_id());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Owners/admins can update company profiles"
  on public.profiles for update
  using (company_id = public.get_my_company_id());

-- Interviews: scoped to company
create policy "Users can view company interviews"
  on public.interviews for select
  using (company_id = public.get_my_company_id());

create policy "Users can insert company interviews"
  on public.interviews for insert
  with check (company_id = public.get_my_company_id());

create policy "Users can update company interviews"
  on public.interviews for update
  using (company_id = public.get_my_company_id());

-- Public access by candidate_token (for candidate interview page)
create policy "Candidates can view by token"
  on public.interviews for select
  using (true);

create policy "Candidates can update consent"
  on public.interviews for update
  using (true)
  with check (true);

-- Reports, flags, timeline, delays, chunks: scoped via interview's company
create policy "View reports for company interviews"
  on public.interview_reports for select
  using (interview_id in (select id from public.interviews where company_id = public.get_my_company_id()));

create policy "Insert reports"
  on public.interview_reports for insert
  with check (true);

create policy "View flags for company interviews"
  on public.interview_flags for select
  using (interview_id in (select id from public.interviews where company_id = public.get_my_company_id()));

create policy "Insert flags"
  on public.interview_flags for insert
  with check (true);

create policy "View timeline for company interviews"
  on public.interview_timeline for select
  using (interview_id in (select id from public.interviews where company_id = public.get_my_company_id()));

create policy "Insert timeline"
  on public.interview_timeline for insert
  with check (true);

create policy "View delays for company interviews"
  on public.response_delays for select
  using (interview_id in (select id from public.interviews where company_id = public.get_my_company_id()));

create policy "Insert delays"
  on public.response_delays for insert
  with check (true);

create policy "View chunks for company interviews"
  on public.transcript_chunks for select
  using (interview_id in (select id from public.interviews where company_id = public.get_my_company_id()));

create policy "Insert chunks"
  on public.transcript_chunks for insert
  with check (true);

-- Email templates: scoped to company
create policy "View own company templates"
  on public.email_templates for select
  using (company_id = public.get_my_company_id());

create policy "Insert own company templates"
  on public.email_templates for insert
  with check (company_id = public.get_my_company_id());

create policy "Update own company templates"
  on public.email_templates for update
  using (company_id = public.get_my_company_id());

create policy "Delete own company templates"
  on public.email_templates for delete
  using (company_id = public.get_my_company_id());

-- ═══════════════════════════════════════════════════════════════════════
-- Realtime
-- ═══════════════════════════════════════════════════════════════════════

alter publication supabase_realtime add table public.interviews;
alter publication supabase_realtime add table public.interview_timeline;
alter publication supabase_realtime add table public.interview_flags;
alter publication supabase_realtime add table public.interview_reports;
