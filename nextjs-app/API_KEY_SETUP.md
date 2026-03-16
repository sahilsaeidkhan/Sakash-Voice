# 🔑 Gemini API Key Setup Guide

## ⚠️ CRITICAL: Why Your App Isn't Working

Your React app is running perfectly, but **both features require a Gemini API key** to work:

1. **Practice Table Topic** - Needs Gemini to generate random topics
2. **Call to Friend** - Needs Gemini to generate AI responses

Without the API key, both modes will show an error message.

---

## 🚀 Get Your Free Gemini API Key (2 minutes)

### Step 1: Go to Google AI Studio
Open this link in your browser:
```
https://aistudio.google.com/app/apikey
```

### Step 2: Create API Key
- Click **"Create API key"** button
- Select "Create new project" or use existing project
- The key will be generated automatically (looks like: `AIzaSy...`)
- Copy it to your clipboard

### Step 3: Add to Your App

**File to edit:**
```
/c/Users/sahil/OneDrive/Documents/GitHub/Sakash/nextjs-app/.env.local
```

**Current content:**
```
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_APP_NAME=Sakash Voice
```

**Change it to:**
```
GEMINI_API_KEY=AIzaSy...your_actual_key...
NEXT_PUBLIC_APP_NAME=Sakash Voice
```

Replace `AIzaSy...your_actual_key...` with your actual key from Step 2.

### Step 4: Restart the Dev Server

1. Stop the current server (if running)
   - Press `Ctrl+C` in the terminal

2. Start it again:
   ```bash
   cd "/c/Users/sahil/OneDrive/Documents/GitHub/Sakash/nextjs-app"
   npm run dev
   ```

3. Open your browser:
   ```
   http://localhost:3003
   ```

---

## ✅ Verify It Works

### Test Practice Table Topic:
1. Click **"Practice Table Topic"** button
2. You should see loading → then a **random topic appears**
3. Click "Start Thinking" button
4. Speak for 10+ seconds
5. You should get **AI feedback**

### Test Call to Friend:
1. Click **"Call to Friend"** button
2. Click "Start Call" button
3. AI should greet you ("Hi! I'm your friend...")
4. Click "Speak" button
5. **Say something** (your voice should be captured)
6. AI should respond to what you said

---

## 🐛 Troubleshooting

### Error: "Gemini API key not configured"
- You forgot to add the key to `.env.local`
- Or the app wasn't restarted after adding the key
- **Fix:** Add key to `.env.local` and restart dev server

### Error: "Speech recognition error: permission-denied"
- Your browser/OS denied microphone access
- **Fix:**
  1. Go to browser settings → Privacy → Microphone
  2. Find "localhost:3003" and set to "Allow"
  3. Refresh the page

### Error: "Speech Recognition API not supported"
- You're using an old browser (Firefox, Safari)
- **Fix:** Use Chrome, Edge, or Chromium-based browser

### Topic not generating (blank page)
- API key might be invalid or expired
- **Fix:**
  1. Test the key at: https://aistudio.google.com/app/apikey
  2. If invalid, create a new one
  3. Update `.env.local` and restart

### Voice input not working in Call to Friend
- **Now fixed!** The mobile silence detection auto-restart is in place
- If still not working, check microphone permissions

---

## 🔒 Important Security Note

**NEVER commit your API key to GitHub!**

The `.env.local` file is already in `.gitignore`, so it won't be uploaded. Keep it safe!

To rotate/revoke your key:
- Go to: https://aistudio.google.com/app/apikey
- Hover over your key and click "Delete"
- Done! It's revoked immediately

---

## 💡 Rate Limits

Gemini API has free tier limits:
- Up to 60 requests per minute
- Up to 1 million requests per day
- Mostly sufficient for personal use

If you exceed limits, you'll see:
```
"429 Too Many Requests"
```

Just wait a minute and try again.

---

## 📝 Next Steps

1. ✅ Get Gemini API key
2. ✅ Add to .env.local
3. ✅ Restart dev server
4. ✅ Test both practice modes
5. 🎯 Enjoy learning!

---

## 🆘 Still Having Issues?

Run these diagnostic commands in browser console:

**Test API directly:**
```javascript
fetch('/api/generate-topic')
  .then(r => r.json())
  .then(d => console.log('Success:', d))
  .catch(e => console.error('Error:', e))
```

**Check microphone:**
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('Microphone: OK'))
  .catch(e => console.error('Microphone:', e.message))
```

**Check Speech API:**
```javascript
console.log('SpeechRecognition:',
  window.SpeechRecognition || window.webkitSpeechRecognition ? 'OK' : 'NOT SUPPORTED')
```

---

**Now go set up your API key and start practicing! 🚀**
