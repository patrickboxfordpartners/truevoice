-- Backfill has_completed_onboarding for all existing users who have already
-- set up their company (company_id is set = they went through prior onboarding)
update profiles
set has_completed_onboarding = true
where company_id is not null
  and has_completed_onboarding = false;
