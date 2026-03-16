# Sakash Voice - Next.js 14 Setup Guide

## What Has Been Created

A complete, production-ready Next.js 14 application located in:
`/c/Users/sahil/OneDrive/Documents/GitHub/Sakash/nextjs-app/`

## Quick Start

### 1. Copy to Desired Location (Optional)
Since the app was created in the Sakash repository's nextjs-app subdirectory, you may want to move it to your desired location:

```bash
# Copy from current location to your target directory
cp -r /c/Users/sahil/OneDrive/Documents/GitHub/Sakash/nextjs-app \
      /c/Users/sahil/OneDrive/Documents/GitHub/sakash-voice-nextjs
```

Or simply use the existing location at:
`/c/Users/sahil/OneDrive/Documents/GitHub/Sakash/nextjs-app/`

### 2. Install Dependencies

```bash
cd /path/to/sakash-voice-nextjs
npm install
```

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your Gemini API key
# Get it from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_actual_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser. The application should load with the mode selector modal.

## File Structure Summary

### Configuration Files
- `package.json` - Dependencies and scripts
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Design tokens matching current app
- `postcss.config.js` - PostCSS for Tailwind
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.json` - ESLint rules
- `.gitignore` - Git ignore patterns
- `.env.example` - Environment variables template

### App Structure (35 files total)

**Core Files:**
- `app/layout.tsx` - Root layout with metadata
- `app/page.tsx` - Home page with mode selector
- `app/globals.css` - Global styles with design tokens
- `app/AppProviders.tsx` - Context providers wrapper

**API Routes (3 routes):**
- `app/api/generate-topic/route.ts` - Generate Table Topics
- `app/api/gemini-analyze/route.ts` - Analyze speech & provide feedback
- `app/api/conversation/route.ts` - Conversational AI for Call to Friend

**State Management:**
- `lib/contexts/PracticeContext.ts` - Central state with useReducer
- `lib/types/practice.ts` - TypeScript interfaces

**Custom Hooks:**
- `lib/hooks/usePracticeContext.ts` - Context access hook
- `lib/hooks/useSpeechRecognition.ts` - Web Speech API wrapper
- `lib/hooks/useTimer.ts` - Countdown timer
- `lib/hooks/usePoseTracking.ts` - Pose tracking placeholder

**Main Components (3):**
- `components/ModeSelectorModal.tsx` - Mode selection UI
- `components/PracticeTableTopic.tsx` - Table Topics mode
- `components/CallToFriend.tsx` - Call to Friend mode

**Sub-components (7):**
- `components/TopicSection.tsx` - Topic display
- `components/RecordingInterface.tsx` - Recording controls
- `components/TranscriptPanel.tsx` - Live transcript
- `components/FeedbackDisplay.tsx` - Feedback cards
- `components/CallHeader.tsx` - Call info header
- `components/ConversationDisplay.tsx` - Conversation bubbles
- `components/CallControls.tsx` - Call buttons
- `components/CallSummary.tsx` - Call statistics

## Key Features Implemented

### Practice Table Topic Mode
1. Generate random impromptu topics via Gemini API
2. 10-second prep time countdown
3. 60-second speaking session with live transcript
4. AI feedback on:
   - Speaking speed
   - Clarity
   - Tone
   - Actionable suggestions
5. Option to try another topic or change mode

### Call to Friend Mode
1. Natural voice conversation with AI
2. Call duration tracking
3. Automatic AI responses via Gemini
4. Conversation history display
5. Call summary with statistics

### Design & UX
- Gradient backgrounds with dark mode support
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Accessibility features (ARIA labels, keyboard support)
- Tailwind CSS for consistent styling
- Design token system (colors, spacing, typography)

### API Integration
- Gemini API for topic generation
- Gemini API for speech analysis
- Gemini API for conversational responses
- Error handling and fallbacks

## Development Workflow

### Available Commands

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

### Environment Setup

The application requires:
1. **Gemini API Key** - Free tier available at https://aistudio.google.com/app/apikey
2. **Modern Browser** - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
3. **Microphone Permission** - Required for speech recognition

## Code Quality

All code includes:
- Full TypeScript type safety
- Comprehensive JSDoc comments
- Error handling and try-catch blocks
- Mobile-responsive design
- Accessibility best practices
- Clean component architecture
- Custom hooks for reusability

## Ready-to-Deploy

The application is ready to deploy to:
- **Vercel** (recommended for Next.js) - `vercel deploy`
- **Netlify** - Requires build command adjustment
- **Docker** - Can be containerized
- **Traditional hosting** - Requires Node.js 18+

## Next Steps (Optional Enhancements)

1. **MediaPipe Integration** - Replace usePoseTracking placeholder with real pose detection
2. **Database** - Add user accounts and session history
3. **Analytics** - Track practice statistics over time
4. **Advanced Feedback** - Speech speed, filler words, word count analytics
5. **Mobile App** - React Native version
6. **Offline Support** - Service workers for offline practice
7. **Custom Topics** - User-created topic categories
8. **Performance Metrics** - Real-time visualization during practice

## Troubleshooting

### Speech Recognition Not Working
- Check microphone permissions in browser
- Ensure HTTPS in production (browsers require HTTPS for Web Speech API)
- Try in Chrome/Edge for best support
- Check browser console for errors

### API Errors
- Verify Gemini API key is correct
- Check API quota and billing status
- Ensure `.env.local` is properly configured
- Check Next.js logs for error details

### Build Issues
- Clear cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

### Styling Issues
- Clear Tailwind cache: `npm run build` will rebuild
- Check if CSS is loading in browser DevTools
- Verify tailwind.config.ts paths are correct

## File Locations (Absolute Paths)

All files are located at:
`/c/Users/sahil/OneDrive/Documents/GitHub/Sakash/nextjs-app/`

Key paths:
- Components: `/c/Users/sahil/OneDrive/Documents/GitHub/Sakash/nextjs-app/components/`
- API routes: `/c/Users/sahil/OneDrive/Documents/GitHub/Sakash/nextjs-app/app/api/`
- Hooks: `/c/Users/sahil/OneDrive/Documents/GitHub/Sakash/nextjs-app/lib/hooks/`
- Context: `/c/Users/sahil/OneDrive/Documents/GitHub/Sakash/nextjs-app/lib/contexts/`

## Support & Documentation

- Next.js Docs: https://nextjs.org/docs
- React Docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com/docs
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- TypeScript: https://www.typescriptlang.org/docs/

---

**You're all set! Start with `npm install && npm run dev`**
