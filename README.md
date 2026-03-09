# Sakash Voice

Sakash Voice is a lightweight Toastmasters Table Topics practice web app built with plain HTML, CSS, and vanilla JavaScript.

It helps users practice impromptu speaking with:

- topic generation
- thinking timer
- live speech transcription (Web Speech API)
- webcam-based body language signals (MediaPipe Pose)
- Gemini-powered AI coaching feedback

## Features

- Gemini API-based Table Topics prompt generation
- Thinking timer options: 5s, 10s, 15s
- Automatic 60-second recording session
- Live transcript updates while speaking
- Body language signal summary:
	- posture
	- gesture level
	- eye contact tendency
- AI feedback covering:
	- speaking speed
	- clarity
	- tone
	- body language
	- suggestions
- Session reset and state management (`Waiting`, `Thinking`, `Recording`, `Processing`, `Completed`)

## Project Structure

```
sakash-voice/
	index.html
	style.css
	script.js
```

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the app server:

```bash
npm start
```

3. Open `http://localhost:3000` in a modern Chromium-based browser (for best Web Speech support).
4. Allow microphone and webcam permissions when prompted.
5. Click `Generate Idea` to start a session.

## Gemini API Key

The app reads Gemini configuration from server environment variables only:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` (optional, default `gemini-2.0-flash`)

Set these in `.env` before running `npm start`.

## Browser Requirements

- Webcam + microphone access
- Web Speech API support (`SpeechRecognition` / `webkitSpeechRecognition`)
- Internet access for:
	- MediaPipe CDN scripts
	- Gemini API

## Troubleshooting

- `Speech recognition unsupported in this browser`:
	Use latest Chrome or Edge.

- `API key was reported as leaked`:
	Generate a new key in Google AI Studio and update it.

- `Generative Language API ... disabled`:
	Enable the API for the key's Google Cloud project, then retry after a few minutes.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Web Speech API
- MediaPipe Pose
- Gemini Generative Language API
