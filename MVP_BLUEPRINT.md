# Sakash Voice - Strict MVP Blueprint
## A Senior Product Architect's Design for 1-2 Week Development

---

## SECTION 1 — MVP FEATURES

### Absolute Minimum to Launch

**Authentication & Onboarding:**
- [ ] Email/Password signup (simple, no OAuth)
- [ ] Sign-in persistence (localStorage for MVP)
- [ ] Skip account: Anonymous session (localStorage random ID)

**Practice Table Topics Mode:**
- [ ] Topic generation via Gemini API
- [ ] Configurable prep time (5-15 seconds)
- [ ] 60-second recording session
- [ ] Speech transcription (Web Speech API)
- [ ] AI feedback via Gemini (single, non-streaming)
- [ ] Feedback display (text only)

**Call to Friend Mode - REAL-TIME VOICE AI:**
- [ ] WebRTC/simple voice stream to backend
- [ ] Gemini conversation API integration
- [ ] AI voice output (SpeechSynthesis API)
- [ ] User voice input (Web Speech API)
- [ ] Conversation history (in-session memory only)
- [ ] "Hang up" to end call
- [ ] Simple metrics: call duration, turns

**Common Features:**
- [ ] Start screen with mode selection
- [ ] Navigation between modes
- [ ] History of past sessions (last 5 only)
- [ ] Simple UI (minimal design, no animations)

### NOT Included (Save for Phase 2):
- Video/camera
- Body language analysis
- Conversation persistence to database
- Friend profiles or social features
- Advanced analytics
- Mobile-optimized UI (responsive only)
- Streaming ML models

---

## SECTION 2 — USER FLOW

### Flow 1: Practice Table Topics
```
1. User opens app → Sees start screen with 2 buttons
2. Clicks "Practice Table Topic"
3. System generates topic (Gemini API)
4. UI shows topic + prep timer (default 10s)
5. Prep time ends → "Start Speaking" button highlights
6. User clicks → 60-second recording session begins
7. Speech transcribed in real-time (Web Speech API)
8. Recording ends automatically or user clicks "Stop"
9. "Processing..." modal appears (2-3 seconds)
10. AI feedback displayed (speech quality, pacing, suggestions)
11. User sees: "Try Again" or "Switch Mode" buttons
```

### Flow 2: Call to Friend (Real-time Voice AI)
```
1. User opens app → Sees start screen
2. Clicks "Call to Friend"
3. Permission prompt: "Allow microphone? Allow speaker?"
4. Call interface appears with "Hang Up" button (large, red)
5. User speaks (Web Speech API captures audio)
6. Audio sent to backend → Gemini processes conversation
7. Gemini response generated
8. Backend sends text to SpeechSynthesis (browser TTS)
9. AI voice plays back (natural speech)
10. User can interrupt by speaking again
11. Conversation continues naturally
12. User clicks "Hang Up" → Call ends, summary shown
13. Summary: duration, turns, brief recap
```

### Flow 3: Home/Navigation
```
1. After any session → Show results + stats
2. "Home" button → Back to start screen
3. "History" button → Last 5 sessions (mode, date, duration)
4. Click session → View details/replay
```

---

## SECTION 3 — CORE SYSTEM ARCHITECTURE

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Next.js)                │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│ │ Start Screen │  │Table Topics  │  │ Call to Friend
│ │   Modal      │  │   Mode       │  │   Mode       │        │
│ └──────────────┘  └──────────────┘  └──────────────┘        │
│        ↓                  ↓                  ↓               │
│   Web Speech API    Web Speech API     WebSocket            │
│   SpeechSynthesis   Gemini (fetch)     Web Speech API       │
│                                        SpeechSynthesis      │
└─────────────────────────────────────────────────────────────┘
                          ↓
              ┌───────────────────────────┐
              │   API Gateway (Node.js)   │
              ├───────────────────────────┤
              │ • /api/topic/generate     │
              │ • /api/feedback           │
              │ • /api/conversation       │
              │ • /api/session/save       │
              │ • /api/history            │
              └───────────────────────────┘
                          ↓
        ┌─────────────────┬──────────────────┐
        ↓                 ↓                  ↓
    ┌────────┐      ┌────────────┐    ┌────────┐
    │ Gemini │      │  Supabase/ │    │ Redis  │
    │  API   │      │  MongoDB   │    │ Cache  │
    └────────┘      └────────────┘    └────────┘
                    (Session History)
```

### Architecture Details

**Frontend (React/Next.js):**
- Single-page app, NO page reloads
- State management: React Context (simple, no Redux)
- Component-based: StartScreen, TopicMode, FriendMode, History
- localStorage for session/history

**Backend (Node.js/Express):**
- Single server instance (no load balancing for MVP)
- Middleware: authentication, logging, error handling
- Routes: topic, feedback, conversation, sessions
- No database for MVP sessions (only store locally)

**APIs Used:**
1. **Google Gemini API** - Topic generation + feedback + conversation
2. **Web Speech API** (browser native) - Speech recognition
3. **SpeechSynthesis API** (browser native) - Voice output
4. **WebSocket** (optional, for Call to Friend streaming)

**Data Flow - Table Topics:**
```
User speaks → Web Speech API captures → Transcription sent to backend
→ Gemini analyzes (speech speed, clarity, tone) → Response sent to frontend
→ Feedback displayed
```

**Data Flow - Call to Friend:**
```
User speaks → Web Speech API captures (interim results) →
Sent to backend via fetch/WebSocket →
Gemini conversation API processes →
Response text sent back →
SpeechSynthesis plays audio in browser
```

---

## SECTION 4 — DATABASE STRUCTURE

### For MVP: MINIMAL Database

**Note:** MVP prioritizes localStorage + stateless backend. Persistent data is optional.

**If using Supabase/MongoDB - Minimal Schema:**

**Table: user_sessions**
```json
{
  "id": "uuid",
  "user_id": "uuid or 'anonymous'",
  "mode": "table_topic | call_to_friend",
  "transcript": "user's speech text",
  "ai_response": "feedback or conversation summary",
  "duration": 60,  // seconds
  "created_at": "timestamp",
  "metadata": {
    "topic": "generated topic (if table topic)",
    "turns": 5,  // conversation turns (if friend mode)
    "user_rating": 4  // optional: user rating (0-5)
  }
}
```

**Table: user_profiles (Optional for MVP)**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "auth_token": "JWT",
  "created_at": "timestamp",
  "total_sessions": 10,
  "preferences": {
    "prep_time": 10,
    "speaking_duration": 60,
    "language": "en"
  }
}
```

### MVP Reality:
- **Recommended approach:** Store sessions in localStorage ONLY
- **Optional:** Supabase + simple session table (save after each session if user clicks "Save")
- **No complex relationships** - flat structure only
- **No real-time sync** - frontend is source of truth

---

## SECTION 5 — API STRUCTURE

### Backend Endpoints (MVP Only)

**Note:** All responses in under 2 seconds. Timeouts → graceful fallback.

#### **POST /auth/signup**
```json
Request: { "email": "user@example.com", "password": "pass123" }
Response: { "token": "jwt", "user_id": "uuid" }
```

#### **POST /auth/login**
```json
Request: { "email": "user@example.com", "password": "pass123" }
Response: { "token": "jwt", "user_id": "uuid" }
```

#### **POST /api/topic/generate**
```json
Request: { "difficulty": "beginner|intermediate|advanced" }  // optional
Response: { "topic": "Should AI replace human teachers?", "topic_id": "uuid" }
```

#### **POST /api/feedback**
```json
Request: {
  "transcript": "I think AI is changing education...",
  "topic": "Should AI replace human teachers?",
  "duration_seconds": 60
}
Response: {
  "speech_quality": "Good pacing and tone",
  "clarity": "Clear and articulate",
  "suggestions": "Try adding more examples",
  "score": 7.5,  // 0-10
  "time_taken_ms": 1200
}
```

#### **POST /api/conversation (Call to Friend)**
```json
Request: {
  "user_message": "Hi, how are you?",
  "conversation_history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! I'm doing great." }
  ],
  "session_id": "uuid"
}
Response: {
  "ai_response": "I'm doing great! How has your day been?",
  "audio_url": null,  // use browser SpeechSynthesis instead
  "turn_number": 2,
  "session_extended": true
}
```

#### **POST /api/session/save**
```json
Request: {
  "user_id": "uuid | null",
  "mode": "table_topic | call_to_friend",
  "transcript": "...",
  "ai_response": "...",
  "duration_seconds": 60,
  "metadata": {}
}
Response: { "session_id": "uuid", "saved": true }
```

#### **GET /api/history**
```json
Query: ?limit=5&user_id=uuid
Response: {
  "sessions": [
    {
      "id": "uuid",
      "mode": "table_topic",
      "date": "2025-01-15T10:30:00Z",
      "duration": 75,
      "score": 7.2,
      "topic": "Should AI replace human teachers?"
    }
  ],
  "total": 5
}
```

#### **GET /api/session/:id**
```json
Response: {
  "id": "uuid",
  "mode": "table_topic",
  "transcript": "...",
  "feedback": "...",
  "duration": 60,
  "date": "2025-01-15T10:30:00Z"
}
```

### Error Handling:
```json
{
  "error": true,
  "message": "User not authenticated",
  "code": "AUTH_REQUIRED",
  "status": 401
}
```

---

## SECTION 6 — FRONTEND COMPONENTS

### React Component Structure (Minimal)

```
App
├── Layout
│   ├── Header (logo + stats)
│   └── Navigation
├── Pages
│   ├── StartScreen
│   │   └── ModeSelector (2 buttons)
│   ├── TableTopicsMode
│   │   ├── TopicDisplay
│   │   ├── Timer (prep + recording)
│   │   ├── RecordingUI (microphone icon + transcript)
│   │   └── FeedbackDisplay
│   ├── CallToFriendMode
│   │   ├── CallInterface
│   │   │   ├── AIAvatar (simple circle)
│   │   │   ├── Transcript (real-time chat)
│   │   │   └── Controls (Hang Up button)
│   │   └── CallStats (duration, turns)
│   ├── History
│   │   └── SessionList (simple cards)
│   └── SessionDetail
│       └── ResultsView
└── Auth
    ├── SignupPage
    ├── LoginPage
    └── ProtectedRoute

Utilities:
├── hooks/useAudioRecording
├── hooks/useConversation
├── services/geminiService
├── services/storageService
└── utils/timeFormatter
```

### Component Details

**StartScreen.jsx**
```jsx
- 2 large buttons: "Practice Table Topic" | "Call to Friend"
- Emoji icons (🎤 | 💬)
- Minimal styling (gray background, clean typography)
- Optional: Show last session score
```

**TableTopicsMode.jsx**
```jsx
- Topic display (centered, large text)
- Prep timer (countdown)
- Microphone button (toggles recording)
- Live transcript (real-time, below mic)
- Feedback section (after recording)
```

**CallToFriendMode.jsx**
```jsx
- Simple call interface (like Apple's phone call UI)
- AI name display ("Friend")
- Large "Hang Up" button (red, bottom center)
- Transcript of conversation (alternating user/AI)
- Call duration (top, updating every 1s)
- No video, no avatar animation
```

**History.jsx**
```jsx
- List of last 5 sessions
- Each session: mode, date, duration, score
- Click to view details
- "Delete" option (client-side only for MVP)
```

### Styling Approach (Apple-like Minimal):
- **Colors:** Mostly white, single accent color (blue/indigo)
- **Typography:** System fonts (SF Pro, Inter)
- **Spacing:** 16px grid, lots of whitespace
- **Buttons:** Rounded rectangles (12px), no shadows initially
- **Animations:** None or very subtle (fade-in, 200ms)
- **Responsive:** Mobile-first, single breakpoint (tablet becomes desktop view)

---

## SECTION 7 — DEVELOPMENT ROADMAP

### Week 1: Foundation & Infrastructure

**Days 1-2: Setup**
- [ ] Next.js project scaffold
- [ ] Node.js/Express backend setup
- [ ] GitHub repo created + .gitignore
- [ ] Environment variables (.env) structure
- [ ] Gemini API key obtained + tested
- **Deliverable:** "Hello World" app running locally

**Days 3-4: Frontend - Start Screen & Basic Layout**
- [ ] StartScreen component (2 buttons)
- [ ] Layout/navigation structure
- [ ] localStorage setup for session
- [ ] CSS framework (Tailwind OR vanilla CSS)
- [ ] Responsive design testing
- **Deliverable:** Click between screens without errors

**Day 5: Authentication (Minimal)**
- [ ] SignUp/Login forms
- [ ] localStorage token storage
- [ ] Protected route wrapper
- [ ] Logout functionality
- [ ] Anonymous session fallback
- **Deliverable:** Can sign up, log in, persist session

### Week 2: Core Features & Integration

**Days 6-7: Table Topics Mode**
- [ ] Topic generation endpoint + frontend integration
- [ ] Web Speech API integration (speech-to-text)
- [ ] Timer UI (prep + recording)
- [ ] Microphone button + recording state
- [ ] Display transcript in real-time
- **Deliverable:** Can generate topic, speak, see transcript

**Days 8-9: Feedback & Call to Friend**
- [ ] Feedback API endpoint (Gemini analysis)
- [ ] Feedback display UI
- [ ] Start Call to Friend mode skeleton
- [ ] Web Speech API for Call to Friend input
- [ ] SpeechSynthesis API setup (browser TTS)
- **Deliverable:** Table Topics gives feedback; Call to Friend starts

**Day 10: Real-time Conversation Loop**
- [ ] Conversation endpoint tested
- [ ] Multi-turn conversation logic
- [ ] User input → AI response → TTS playback loop
- [ ] Call interface UI
- [ ] "Hang Up" button + session end
- **Deliverable:** Can have a simple 2-3 turn conversation with AI

**Days 11-12: History & Polish**
- [ ] Session save endpoint
- [ ] History page (list of sessions)
- [ ] Session detail view
- [ ] Error handling improvements
- [ ] Performance optimization (if needed)
- [ ] UI polish (spacing, colors, fonts)
- [ ] **Public testing on localhost**
- **Deliverable:** Full feature-complete MVP

**Days 13-14: Deployment & Final Testing**
- [ ] Deploy backend (Vercel, Heroku, or Railway)
- [ ] Deploy frontend (Vercel)
- [ ] Environment variables configured
- [ ] Cross-device testing (phone, tablet, desktop)
- [ ] Bug fixes + final tweaks
- [ ] README + setup instructions
- **Deliverable:** Live, working app

---

## SECTION 8 — FUTURE FEATURES (NOT MVP)

### Phase 2 (Post-MVP):
- [ ] Video/webcam integration
- [ ] Real-time pose detection (MediaPipe)
- [ ] User friend profiles & conversation history persistence
- [ ] Conversation history saved to database
- [ ] Advanced analytics (speaking speed, tone analysis)
- [ ] Different voice options for AI (male/female)
- [ ] Background noise reduction
- [ ] Leaderboards (stats comparison)
- [ ] Social sharing (TikTok-style clips)
- [ ] Mobile app (React Native)

### Phase 3 (Scaling):
- [ ] Real-time transcription (Deepgram or similar)
- [ ] Streaming LLM responses (Claude/GPT)
- [ ] Multi-language support
- [ ] Advanced voice synthesis (ElevenLabs)
- [ ] Conversation replay (video + transcript)
- [ ] Achievement badges
- [ ] Teaming/group practice sessions
- [ ] Integration with Toastmasters API

### NOT Planned:
- [ ] Video call between users (use Gather.town instead)
- [ ] AI character avatars
- [ ] 3D environments
- [ ] AR features
- [ ] Blockchain/crypto anything
- [ ] Enterprise SSO

---

## IMPLEMENTATION QUICK-START

### Tech Stack Summary (MVP)
| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | Next.js + React | Fast, SSR optional, easy deployment |
| Backend | Node.js + Express | Simple, familiar, JavaScript full-stack |
| Database | localStorage (MVP) | No backend DB needed, optional Supabase later |
| AI | Google Gemini | Free tier sufficient, easy API, good V2 model |
| Voice Input | Web Speech API | Free, browser native, iOS + Android support |
| Voice Output | SpeechSynthesis API | Free, browser native, works everywhere |
| Hosting | Vercel (both) | Free tier, simple deployment, fast |
| Auth | Custom JWT + localStorage | No third-party dependency for MVP |

### Estimated Development Power: **1 Senior Developer**

### Risk Factors & Mitigation:
| Risk | Mitigation |
|------|-----------|
| Web Speech API reliability | Fallback: manual transcript input |
| Gemini API rate limits | Cache responses, add queuing |
| SpeechSynthesis quality | Use premium voice options, set proper params |
| Real-time lag | Use WebSocket vs HTTP polling |
| Mobile microphone issues | Test early with real devices |

---

## DEFINITION OF DONE (MVP)

✅ **Feature-Complete:**
- Start screen with mode selection works
- Table Topics mode: generate → speak → get feedback ✓
- Call to Friend mode: voice conversation with AI ✓
- Session history (last 5) ✓

✅ **Quality Bars:**
- No console errors
- Responsive on mobile (320px - 1920px)
- < 3 second response time for all APIs
- Works on Chrome, Safari, Firefox
- Graceful error handling (no white screens)

✅ **Performance:**
- First paint: < 2 seconds
- Topic generation: < 1.5 seconds
- Feedback response: < 2 seconds
- Conversation response: < 1 second

✅ **Usability:**
- New user can complete a session in < 2 minutes
- Clear visual feedback for all actions
- Obvious "Hang Up" button in Call mode
- No jargon in UI

---

## APPENDIX: Key Decision Rationale

### Why No Database for MVP?
- Adds complexity (schema, migrations, queries)
- Introduces data privacy concerns
- localStorage sufficient for single user testing
- Supabase can be added in 1-2 days post-MVP

### Why Web Speech API vs Third-Party?
- Free, no API keys for voice input
- Works offline (except Gemini calls)
- 95%+ browser support
- Reduces backend complexity

### Why Gemini vs ChatGPT/Claude?
- Lower latency (Google data centers)
- Free tier: 60 requests/minute (enough for MVP)
- Good conversational quality
- Easy streaming support for future

### Why Single Backend Instance?
- MVP: < 1000 users expected
- Deployment simpler (1 dyno on Heroku)
- Scaling to multiple instances takes 1-2 days

---

## CONCLUSION

This MVP can be **built by a single developer in 10-14 days** and deployed to production. It focuses on:
1. **Simplicity** - minimal features, maximum clarity
2. **Speed** - fast development, fast deployment
3. **User Experience** - Apple-like minimal design
4. **Viability** - actually useful for practicing speaking

After launch, gather user feedback before investing in Phase 2 features.

**Let's build Sakash Voice! 🚀**
