# Quick Reference: React Architecture Guide

## File Organization

```
sakash-voice-nextjs/
─ app/
  ├─ layout.tsx                    # Root layout with providers
  ├─ page.tsx                      # Home page with mode selector
  ├─ api/
  │  ├─ generate-topic/route.ts
  │  ├─ gemini-analyze/route.ts
  │  └─ conversation/route.ts
  └─ practice/
     ├─ layout.tsx
     ├─ table-topic/page.tsx       # Table Topics page
     └─ call-to-friend/page.tsx    # Call to Friend page
─ components/
  ├─ ModeSelectorModal.tsx         # Start screen
  ├─ PracticeTableTopic.tsx        # Table Topics container
  ├─ CallToFriend.tsx              # Call to Friend container
  └─ sub-components/
     ├─ TopicSection.tsx
     ├─ RecordingInterface.tsx
     ├─ TranscriptPanel.tsx
     ├─ FeedbackDisplay.tsx
     ├─ CallHeader.tsx
     ├─ ConversationDisplay.tsx
     ├─ CallControls.tsx
     └─ CallSummary.tsx
─ lib/
  ├─ contexts/
  │  └─ PracticeContext.ts         # Global state
  ├─ hooks/
  │  ├─ usePracticeContext.ts      # Access context
  │  ├─ useSpeechRecognition.ts    # Speech API
  │  ├─ useTimer.ts                # Countdown logic
  │  ├─ usePoseTracking.ts         # MediaPipe
  │  └─ useRecording.ts            # Recording state
  ├─ types/
  │  ├─ practice.ts                # TypeScript types
  │  ├─ speech.ts
  │  └─ api.ts
  ├─ utils/
  │  ├─ formatters.ts
  │  ├─ errorHandlers.ts
  │  └─ validators.ts
  └─ services/
     ├─ topicService.ts
     ├─ feedbackService.ts
     └─ conversationService.ts
─ styles/
  ├─ globals.css
  ├─ components/
  │  ├─ ModeSelectorModal.module.css
  │  ├─ PracticeTableTopic.module.css
  │  └─ CallToFriend.module.css
  └─ variables.css
```

## Component Dependency Tree

```
App
├─ PracticeProvider (Context)
│  └─ Home Page
│     ├─ ModeSelectorModal
│     │  └─ [User selects mode]
│     │
│     └─ Practice Layout
│        ├─ PracticeTableTopic
│        │  ├─ useSpeechRecognition
│        │  ├─ useTimer
│        │  ├─ usePoseTracking
│        │  └─ Sub-components (TopicSection, RecordingInterface, etc.)
│        │
│        └─ CallToFriend
│           ├─ useSpeechRecognition
│           ├─ SpeechSynthesis
│           └─ Sub-components (CallHeader, ConversationDisplay, etc.)
```

## State Management Flow

```
User Action
    ↓
Component calls setState() (e.g., setCurrentState('recording'))
    ↓
Reducer processes action
    ↓
PracticeContext state updated
    ↓
All consumers of context re-render
    ↓
UI updates automatically
```

## API Request Pattern

```
Component:  fetch('/api/endpoint')
                ↓
Backend:    app/api/endpoint/route.ts
                ↓
Service:    Call external APIs (Gemini, etc.)
                ↓
Response:   Return JSON
                ↓
Component:  Update state
                ↓
UI:         Re-render with new data
```

## Lifecycle: Table Topics Mode

```
Component Mount
    ↓
useEffect: Generate topic
    ↓
Topic displayed, user clicks "Start"
    ↓
Prep timer countdown
    ↓
Recording starts automatically
    ↓
User speaks (speech recognition captures)
    ↓
Speaking timer counts down
    ↓
Recording stops (auto or manual)
    ↓
Fetch feedback from API
    ↓
Display feedback
    ↓
User can try again or reset
```

## Lifecycle: Call to Friend Mode

```
Component Mount
    ↓
Show "Start Call" button
    ↓
User clicks button
    ↓
AI greeting generated and spoken
    ↓
Auto-start listening
    ↓
User speaks
    ↓
Speech ends → fetch AI response
    ↓
AI response spoken
    ↓
Auto-start listening (natural loop)
    ↓
[Repeat until "Hang Up"]
    ↓
Show call summary
```

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| **Context API instead of Redux** | Simpler setup, sufficient for this app's complexity |
| **useReducer for state** | Predictable state transitions, easy to debug |
| **Custom hooks for logic** | Reusable, testable, isolated from UI |
| **CSS Modules for styling** | Type-safe class names, scoped to components |
| **API routes in Next.js** | Serverless, automatic scaling, environment variables |
| **Separate mode components** | Each mode independent, easier to maintain |
| **No prop drilling** | All components use usePracticeContext() directly |

## Testing Strategy

```
Unit Tests (Jest):
- useSpeechRecognition hook
- useTimer hook
- usePoseTracking hook
- Utility functions (formatters, validators)

Component Tests (React Testing Library):
- ModeSelectorModal
- TopicSection
- RecordingInterface
- Each sub-component in isolation

Integration Tests (Cypress/Playwright):
- Full Table Topics flow
- Full Call to Friend flow
- Mode switching
- Error scenarios

E2E Tests (in production):
- Real browser testing
- Mobile device testing
- API integration
```

## Migration Checklist

- [ ] Create Next.js project with TS
- [ ] Setup styling system (CSS Modules + variables)
- [ ] Create Context and reducer
- [ ] Implement useSpeechRecognition hook
- [ ] Implement useTimer hook
- [ ] Implement usePoseTracking hook
- [ ] Create sub-components
- [ ] Migrate TableTopicMode logic
- [ ] Migrate CallToFriend logic
- [ ] Migrate API endpoints
- [ ] Setup error boundaries
- [ ] Write tests
- [ ] Performance optimization
- [ ] Deploy to Vercel

## Debugging Tips

**Check Context:**
```
Use React DevTools → Components → Click component → See props
```

**Check State:**
```
usePracticeContext() returns current state
console.log(context.currentState, context.transcript, etc.)
```

**Check Hooks:**
```
Each hook logs to console for debugging
Search for "console.debug" in hook files
```

**Network:**
```
DevTools Network tab → See API calls
Check request/response bodies
```

## Performance Optimization

- Code splitting: Load only active mode
- Memoization: memo() for expensive components
- Lazy loading: dynamic() for routes
- Image optimization: Use Next.js <Image>
- CSS optimization: Tree-shake unused CSS
- Font optimization: Load system fonts first

## Deployment

```
npm run build    # Build Next.js app
npm run start    # Start production server

Or deploy to Vercel:
git push origin main  # Auto-deploys
```

---

**Ready to migrate! This guide provides complete architecture for scaling Sakash Voice.** 🚀
