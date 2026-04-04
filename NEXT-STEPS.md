# Next Steps - Quick Reference

## Current Status
✅ **Transcription working**
✅ **Analysis API calls working**
❌ **Scores returning all zeros**

## Immediate Next Step

**Debug XAI/Grok API Issue**

### Option 1: Check Supabase Logs
```
1. Open: https://supabase.com/dashboard/project/pvkxngyfaupqgdhgzmou/functions
2. Click "analyze-chunk"
3. Go to "Logs" tab
4. Look for recent entries with [analyze-chunk] prefix
5. Check what XAI API is returning
```

### Option 2: Test in Browser
```
1. npm run dev
2. Start Analysis in browser
3. Speak for 20+ seconds
4. Open Console (F12)
5. Look for: "[analysis] Full response data: ..."
6. Expand the object to see what's inside
```

## What to Look For

### In Supabase Logs:
- `[analyze-chunk] Grok API status:` - Should be 200
- `[analyze-chunk] Grok raw response:` - What XAI returned
- `[analyze-chunk] Parsed analysis:` - What we extracted
- Any error messages

### In Browser Console:
- `[analysis] Full response data:` - Complete API response
- `[analysis] Overall score:` - Should not be 0
- `[analysis] ⚠️ All scores are zero!` - Confirms the issue

## Possible Causes

1. **XAI API Key Invalid**
   - Check if key is still valid
   - Regenerate if needed
   - Update with: `supabase secrets set XAI_API_KEY=new-key`

2. **XAI API Response Format Changed**
   - Grok might be returning different JSON structure
   - Check raw response in logs

3. **Rate Limiting**
   - XAI might be rate limiting requests
   - Check for error codes in response

4. **Parsing Issue**
   - JSON extraction regex might be failing
   - Check the content before/after parsing

## Quick Test Command

```bash
# From project directory
cd /Users/patrickmitchell/true-voice-insights
npm run dev
# Open http://localhost:8080
# Start interview, speak, wait 20 seconds
```

## If Scores Work After Fix

Then test:
1. ✅ Scores update in sidebar every 20 seconds
2. ✅ Overall score gauge updates
3. ✅ Flags appear when patterns detected
4. ✅ Timeline shows score progression
5. ✅ Final report generates on interview completion

## Files to Check

- `supabase/functions/analyze-chunk/index.ts` - Edge function with XAI call
- `src/hooks/useLiveInterview.ts` - Frontend analysis handling
- `.env.local` - Environment variables

## Helpful Commands

```bash
# Check secrets
supabase secrets list

# Redeploy function after changes
supabase functions deploy analyze-chunk

# Check function status
supabase functions list
```

## Contact Info

**Supabase Project:** pvkxngyfaupqgdhgzmou
**Region:** East US (North Virginia)
**Dashboard:** https://supabase.com/dashboard/project/pvkxngyfaupqgdhgzmou
