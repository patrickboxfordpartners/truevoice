ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS api_key UUID DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS companies_api_key_idx ON public.companies(api_key);
