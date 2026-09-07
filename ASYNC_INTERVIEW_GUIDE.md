# Async Interview Feature - TrueVoice HQ

## Overview

The async interview feature allows candidates to complete interviews at their own pace by answering pre-recorded AI-voiced questions. This complements the existing live video interview system.

## Architecture

### 1. Database Schema (Convex)

#### `interview_questions` Table
- `text`: Question text
- `audioUrl`: ElevenLabs generated MP3
- `position`: Order in interview
- `category`: behavioral, technical, culture-fit, situational, general
- `companyId`: Company-specific questions
- `isActive`: Toggle questions on/off

#### `candidate_responses` Table
- `interviewId`: Links to Supabase interviews
- `questionId`: Links to interview_questions
- `candidateId`: Candidate identifier
- `videoUrl`: Recorded video response (Supabase Storage)
- `transcriptText`: Transcription from Deepgram
- `authenticityScore`: 0-100 score
- `flagCount`: Number of fraud flags
- `analysisDetails`: XAI Grok analysis results

### 2. ElevenLabs Integration

**File**: `convex/actions/generateQuestionAudio.ts`

- Uses Rachel voice (professional female, neutral) by default
- Generates MP3 audio from question text
- Uploads to Supabase Storage
- Caches generated audio to avoid regeneration

**API Configuration**:
- Model: `eleven_monolingual_v1` (fast, high-quality English)
- Voice Settings:
  - Stability: 0.7 (balance between consistency and expressiveness)
  - Similarity Boost: 0.8 (voice similarity)
  - Style: 0.3 (natural speaking)

### 3. User Interface

#### Question Bank (`/question-bank`)
- CRUD operations for interview questions
- Drag-and-drop reordering
- Category filtering
- Generate Audio button (calls ElevenLabs)
- Preview button (plays audio)
- Active/Inactive toggle

#### Async Interview Flow (`/async-interview/:token`)

**Steps**:
1. **Welcome**: Overview of async interview process
2. **Consent**: Video recording and AI analysis consent
3. **System Check**: Camera, mic, internet verification with live preview
4. **Instructions**: Quick tips for candidates
5. **Questions**: One-by-one question flow
6. **Complete**: Confirmation screen

**Question Screen Features**:
- Progress bar (X of Y questions)
- Live video preview
- Question text display
- "Replay Question" button (plays ElevenLabs audio)
- Recording timer with REC indicator
- "Start Recording" / "Stop & Save" buttons
- "Skip" button

**Recording**:
- Uses MediaRecorder API
- Format: video/webm (VP9 video + Opus audio)
- Auto-uploads to Supabase Storage on stop
- Saves response to Convex
- Auto-advances to next question

#### Response Review (`AsyncResponseReview` component)

**Features**:
- Summary stats: questions answered, total duration, average score, total flags
- Response list (sidebar)
- Response detail (main panel) with tabs:
  - **Video**: Playback with controls
  - **Transcript**: Full transcription
  - **Analysis**: Authenticity score gauge, flags, analysis details

## API Endpoints

### Convex Mutations
- `createInterviewQuestion`: Add new question
- `updateInterviewQuestion`: Edit question (text, audio, position, category, isActive)
- `deleteInterviewQuestion`: Remove question
- `createCandidateResponse`: Save video response
- `updateCandidateResponse`: Update response (transcript, score, analysis)

### Convex Queries
- `getQuestionsByCompany`: Get all questions for a company (with activeOnly filter)
- `getQuestion`: Get single question by ID
- `getResponsesByInterview`: Get all responses for an interview
- `getResponseByInterviewAndQuestion`: Get specific response
- `getResponsesByCandidate`: Get all responses for a candidate

### Convex Actions
- `generateQuestionAudio`: Generate ElevenLabs audio for a question

## Environment Variables

Required in Convex dashboard:

```
ELEVENLABS_API_KEY=sk_...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
```

## Integration with Existing System

### Supabase
- Uses existing `interview-recordings` storage bucket
- Path structure: `async-questions/` for audio, `async-responses/` for videos
- Uses existing `interviews` table for candidate consent and status

### Deepgram
- Can reuse existing transcription logic from `useVideoInterview` hook
- Add transcript processing for async responses

### XAI Grok
- Can reuse existing authenticity analysis
- Apply to async response transcripts
- Store results in `candidate_responses.analysisDetails`

## Future Enhancements

### Phase 1 (Current)
- ✅ Question bank management
- ✅ ElevenLabs audio generation
- ✅ Async interview flow
- ✅ Video recording and upload
- ✅ Response review UI

### Phase 2 (Pending)
- ⏳ Automatic transcription (Deepgram integration)
- ⏳ Automatic authenticity analysis (XAI Grok)
- ⏳ Response comparison across candidates
- ⏳ Analytics dashboard for async interviews
- ⏳ Email notifications on completion
- ⏳ Question templates library
- ⏳ Multi-language support (ElevenLabs supports 29 languages)

## Usage

### For Hiring Teams

1. **Create Questions**: Navigate to `/question-bank`
2. **Add Questions**: Click "Add Question", enter text, select category
3. **Generate Audio**: Click the speaker icon to generate AI voice
4. **Organize**: Drag to reorder, filter by category
5. **Send Link**: Share `/async-interview/:token` with candidates
6. **Review Responses**: View responses in candidate profile or dedicated review page

### For Candidates

1. Click interview link
2. Complete consent and system checks
3. Answer questions one by one
4. Record as many takes as needed
5. Submit when complete

## Testing

### Test ElevenLabs Integration

```bash
# In Convex dashboard
curl -X POST https://hip-gopher-604.convex.cloud/api/run \
  -H "Content-Type: application/json" \
  -d '{
    "path": "actions/generateQuestionAudio",
    "args": {
      "questionId": "<question-id>",
      "questionText": "Tell me about yourself"
    }
  }'
```

### Test Recording Flow

1. Navigate to `/async-interview/:token`
2. Complete consent flow
3. Allow camera/mic permissions
4. Record a response
5. Verify video upload to Supabase Storage
6. Check Convex for response record

## Troubleshooting

### Audio Generation Fails
- Check `ELEVENLABS_API_KEY` is set in Convex
- Verify API key is valid and has credits
- Check Convex logs for error details

### Video Recording Fails
- Ensure browser supports MediaRecorder (Chrome, Edge, Firefox, Safari 14.1+)
- Check camera/mic permissions are granted
- Verify Supabase Storage bucket permissions

### Upload Fails
- Check `SUPABASE_SERVICE_KEY` is set correctly
- Verify Storage bucket `interview-recordings` exists
- Check file size limits (default 50MB per file)

## Cost Estimation

### ElevenLabs
- ~1,000 characters per question
- Starter plan: 30,000 characters/month = ~30 questions
- Creator plan: 100,000 characters/month = ~100 questions
- Pro plan: 500,000 characters/month = ~500 questions

### Supabase Storage
- Video: ~5-10 MB per minute of recording
- Audio: ~500 KB per question
- Free tier: 1 GB storage
- Estimate: ~100-200 async interviews per GB

### Convex
- Reads: Minimal (questions fetched once per interview)
- Writes: 1 write per response
- Storage: Minimal (metadata only, videos in Supabase)
