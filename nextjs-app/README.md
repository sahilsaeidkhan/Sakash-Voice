# Sakash Voice - Next.js 14 Application

Production-ready speech practice web app with real-time AI feedback for Toastmasters Table Topics practice.

## Features

- **Two Practice Modes:**
  - **Practice Table Topic**: AI-generated impromptu topics with comprehensive feedback
  - **Call to Friend**: Natural voice conversation with AI companion

- **Real-time Feedback:**
  - Speaking speed analysis
  - Clarity assessment
  - Tone evaluation
  - Actionable improvement suggestions

- **Technical Features:**
  - Web Speech API for transcription
  - Gemini AI integration for feedback
  - Responsive design (mobile, tablet, desktop)
  - Dark mode support
  - Accessibility-first approach

## Project Structure

```
sakash-voice-nextjs/
├── app/
│   ├── api/
│   │   ├── generate-topic/route.ts       # Topic generation API
│   │   ├── gemini-analyze/route.ts       # Speech feedback API
│   │   └── conversation/route.ts         # Conversation AI API
│   ├── AppProviders.tsx                  # Context providers wrapper
│   ├── layout.tsx                        # Root layout
│   ├── page.tsx                          # Home page
│   └── globals.css                       # Global styles & design tokens
├── components/
│   ├── ModeSelectorModal.tsx             # Mode selection interface
│   ├── PracticeTableTopic.tsx            # Table Topics mode component
│   ├── CallToFriend.tsx                  # Call to Friend mode component
│   ├── TopicSection.tsx                  # Topic display component
│   ├── RecordingInterface.tsx            # Recording controls
│   ├── TranscriptPanel.tsx               # Live transcript display
│   ├── FeedbackDisplay.tsx               # Feedback results display
│   ├── CallHeader.tsx                    # Call information header
│   ├── ConversationDisplay.tsx           # Conversation messages
│   ├── CallControls.tsx                  # Call control buttons
│   └── CallSummary.tsx                   # Call summary stats
├── lib/
│   ├── contexts/
│   │   └── PracticeContext.ts            # State management context
│   ├── hooks/
│   │   ├── usePracticeContext.ts         # Context hook
│   │   ├── useSpeechRecognition.ts       # Web Speech API hook
│   │   ├── useTimer.ts                   # Countdown timer hook
│   │   └── usePoseTracking.ts            # Pose tracking hook
│   └── types/
│       └── practice.ts                   # TypeScript type definitions
├── next.config.js                        # Next.js configuration
├── tailwind.config.ts                    # Tailwind CSS configuration
├── postcss.config.js                     # PostCSS configuration
├── tsconfig.json                         # TypeScript configuration
├── package.json                          # Dependencies
└── README.md                             # This file
```

## Prerequisites

- Node.js 18+
- npm or yarn
- Gemini API key (get one from [Google AI Studio](https://aistudio.google.com/app/apikey))

## Installation

1. Clone the repository:
```bash
cd sakash-voice-nextjs
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Edit `.env.local` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_api_key_here
```

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

Build the application:

```bash
npm run build
npm start
```

## Key Architecture

### State Management
- **PracticeContext**: Centralized state using useReducer
- Manages all practice data (topic, transcript, feedback, call state)
- Available to all components via usePracticeContext hook

### Hooks
- **useSpeechRecognition**: Web Speech API wrapper with continuous recognition
- **useTimer**: Countdown timer for prep and speaking phases
- **usePoseTracking**: Body language tracking (placeholder for MediaPipe integration)

### API Routes
- `/api/generate-topic`: Generates random Table Topics questions
- `/api/gemini-analyze`: Analyzes speech and provides feedback
- `/api/conversation`: Generates conversational responses for Call to Friend

### Design System
- **Spacing Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- **Colors**: Indigo primary with semantic colors (success, warning, danger)
- **Typography**: Responsive font sizes with 8 breakpoints
- **Components**: Styled with Tailwind CSS for consistency

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Known Limitations

- Speech Recognition API has varying support across browsers
- Pose tracking is currently a placeholder (ready for MediaPipe integration)
- Speech Synthesis voice varies by browser/OS

## Future Enhancements

1. MediaPipe integration for advanced pose tracking
2. Real-time body language metrics dashboard
3. Speech analytics (word count, pace, filler words)
4. Performance history and progress tracking
5. Custom topic categories and difficulty levels
6. Session recording and playback
7. Peer comparison and leaderboards
8. Integration with Toastmasters timing standards

## Troubleshooting

### Speech Recognition not working
- Ensure microphone permissions are granted
- Test in a supported browser (Chrome/Edge recommended)
- Check that HTTPS is used in production

### API errors
- Verify Gemini API key is correct
- Check remaining API quota
- Ensure environment variable is loaded: `console.log(process.env.GEMINI_API_KEY)`

### Styling issues
- Clear `.next` cache: `rm -rf .next`
- Rebuild Tailwind: `npm run build`

## Performance Optimization

- Server-side rendering with Next.js
- Static generation for stable content
- Tailwind CSS purging for minimal bundle
- Image optimization via Next.js Image component (ready to implement)
- Lazy loading for heavy components

## Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- High contrast colors for visibility
- Semantic HTML structure
- Focus management for modals

## License

MIT License - Feel free to use this project for your own purposes.

## Support

For issues or feature requests, please create an issue in the repository.

---

**Happy practicing! 🎤**
