const generateButton = document.getElementById("generateButton");
const resetButton = document.getElementById("resetButton");
const thinkingTimeSelect = document.getElementById("thinkingTime");
const speakingTimeSelect = document.getElementById("speakingTime");
const topicBox = document.getElementById("topicBox");
const statusText = document.getElementById("statusText");
const countdownText = document.getElementById("countdown");
const micButton = document.getElementById("micButton");
const micLabel = document.getElementById("micLabel");
const waveform = document.getElementById("waveform");
const recordingStatus = document.getElementById("recordingStatus");
const stopRecordingButton = document.getElementById("stopRecordingButton");
const webcamVideo = document.getElementById("webcamVideo");
const poseSummary = document.getElementById("poseSummary");
const transcriptBox = document.getElementById("transcriptBox");
const recordingArea = document.getElementById("recordingArea");
const callInterface = document.getElementById("callInterface");
const callMicButton = document.getElementById("callMicButton");
const hangUpButton = document.getElementById("hangUpButton");
const callDurationDisplay = document.getElementById("callDuration");
const callStatusText = document.getElementById("callStatusText");
const conversationHistory = document.getElementById("conversationHistory");
const transcriptionDisplay = document.getElementById("transcriptionDisplay");
const callSummarySection = document.getElementById("callSummary");
const callSummaryText = document.getElementById("callSummaryText");
const callStatusSection = document.getElementById("callStatus");

const STATES = {
  WAITING: "Waiting",
  THINKING: "Thinking",
  RECORDING: "Recording",
  PROCESSING: "Processing",
  COMPLETED: "Completed"
};

const MODES = {
  TABLE_TOPIC: "table-topic",
  CALL_TO_FRIEND: "call-to-friend"
};

const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
const supportsSpeech = Boolean(SpeechRecognitionClass);
const supportsPose = typeof window.Pose === "function";

let currentState = STATES.WAITING;
let currentMode = null;
let activeTopic = "";

let thinkingInterval = null;
let recordingInterval = null;
let recordingStopTimeout = null;
let processingTimeout = null;

let recognition = null;
let isRecognitionStopping = false;
let isRecognitionStarted = false;
let finalTranscript = "";
let hasSpeech = false;

let camera = null;
let mediaStream = null;
let pose = null;

// Call to Friend specific variables
let callActive = false;
let callStartTime = null;
let callDurationInterval = null;
let callConversationHistory = [];
let isListening = false;
let isSpeaking = false;
let interimTranscript = "";

const poseMetrics = {
  frames: 0,
  leaningForwardFrames: 0,
  shoulderTiltFrames: 0,
  lookingAwayFrames: 0,
  wristMovementEvents: 0,
  prevLeftWrist: null,
  prevRightWrist: null,
  lastMovementTime: 0
};

function setState(state) {
  currentState = state;
  statusText.textContent = state;

  // Update data-state attributes for styling
  topicBox.setAttribute("data-state", state.toLowerCase());
  transcriptBox.setAttribute("data-state", state.toLowerCase());
  feedbackCard.setAttribute("data-state", state.toLowerCase());

  const busy = state === STATES.THINKING || state === STATES.RECORDING || state === STATES.PROCESSING;
  generateButton.disabled = busy;
  thinkingTimeSelect.disabled = busy;
  speakingTimeSelect.disabled = busy;

  if (state !== STATES.RECORDING) {
    stopRecordingButton.hidden = true;
    stopRecordingButton.disabled = true;
  }
}

function showProcessingModal() {
  processingModal.hidden = false;
  // Disable interactions
  generateButton.disabled = true;
}

function hideProcessingModal() {
  processingModal.hidden = true;
}

function showStartScreen() {
  startScreenModal.hidden = false;
}

function hideStartScreen() {
  startScreenModal.hidden = true;
}

function formatSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function setRecordingUI(isRecording) {
  console.log("setRecordingUI called. isRecording:", isRecording);

  micButton.classList.toggle("recording", isRecording);
  micButton.setAttribute("aria-pressed", isRecording.toString());
  micButton.setAttribute("data-state", isRecording ? "recording" : "idle");
  waveform.classList.toggle("active", isRecording);
  micLabel.textContent = isRecording ? "Recording" : "Idle";
  recordingStatus.textContent = isRecording ? "Recording..." : "Not Recording";
  recordingStatus.classList.toggle("active", isRecording);

  // Update mic button aria-label
  micButton.setAttribute("aria-label", isRecording ? "Microphone button - Currently recording" : "Microphone button - Click to start recording");

  if (isRecording) {
    console.log("Showing stop recording button");
    stopRecordingButton.hidden = false;
    stopRecordingButton.disabled = false;
  }
}

function resetPoseMetrics() {
  poseMetrics.frames = 0;
  poseMetrics.leaningForwardFrames = 0;
  poseMetrics.shoulderTiltFrames = 0;
  poseMetrics.lookingAwayFrames = 0;
  poseMetrics.wristMovementEvents = 0;
  poseMetrics.prevLeftWrist = null;
  poseMetrics.prevRightWrist = null;
  poseMetrics.lastMovementTime = 0;
}

function clearTimers() {
  if (thinkingInterval) {
    clearInterval(thinkingInterval);
    thinkingInterval = null;
  }
  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }
  if (recordingStopTimeout) {
    clearTimeout(recordingStopTimeout);
    recordingStopTimeout = null;
  }
  if (processingTimeout) {
    clearTimeout(processingTimeout);
    processingTimeout = null;
  }
}

function initSpeechRecognition() {
  if (!supportsSpeech) {
    return;
  }

  recognition = new SpeechRecognitionClass();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isRecognitionStarted = true;
  };

  recognition.onresult = (event) => {
    let interim = "";

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const r = event.results[i];
      const text = r[0]?.transcript || "";

      if (r.isFinal) {
        finalTranscript += `${text} `;
      } else {
        interim += text;
      }
    }

    const merged = `${finalTranscript}${interim}`.trim();
    if (merged) {
      hasSpeech = true;
      transcriptBox.textContent = merged;
    }
  };

  recognition.onerror = (event) => {
    // Only stop on critical errors
    console.debug("Speech recognition error:", event.error);
  };

  recognition.onend = () => {
    if (isRecognitionStopping) {
      isRecognitionStopping = false;
      processAndGetFeedback();
      return;
    }

    // If recording is still active, restart recognition
    // (silence/timeout ended it prematurely, especially on mobile)
    if (currentState === STATES.RECORDING) {
      console.debug("Speech recognition ended during recording, restarting...");
      try {
        recognition.start();
      } catch (error) {
        console.debug("Failed to restart recognition:", error);
        // Will be caught by 60-second timer fallback
      }
    }
  };
}

function summarizePoseData() {
  if (poseMetrics.frames === 0) {
    return {
      posture: "insufficient data",
      gesture_level: "insufficient data",
      eye_contact: "insufficient data"
    };
  }

  const leanRatio = poseMetrics.leaningForwardFrames / poseMetrics.frames;
  const tiltRatio = poseMetrics.shoulderTiltFrames / poseMetrics.frames;
  const lookAwayRatio = poseMetrics.lookingAwayFrames / poseMetrics.frames;
  const movementScore = poseMetrics.wristMovementEvents;

  let posture = "upright and balanced";
  if (leanRatio > 0.4) {
    posture = "slightly leaning forward";
  }
  if (tiltRatio > 0.35) {
    posture = "uneven shoulder alignment";
  }

  let gestureLevel = "moderate";
  if (movementScore < 6) {
    gestureLevel = "low";
  } else if (movementScore > 20) {
    gestureLevel = "high";
  }

  let eyeContact = "mostly steady";
  if (lookAwayRatio > 0.35) {
    eyeContact = "looking away frequently";
  }

  return {
    posture,
    gesture_level: gestureLevel,
    eye_contact: eyeContact
  };
}

function updatePoseMetrics(landmarks) {
  if (!landmarks || landmarks.length < 33) {
    return;
  }

  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  poseMetrics.frames += 1;

  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipMidY = (leftHip.y + rightHip.y) / 2;

  const torsoLength = Math.max(0.001, hipMidY - shoulderMidY);
  const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
  const noseOffset = Math.abs(nose.x - shoulderMidX);

  if (torsoLength < 0.18) {
    poseMetrics.leaningForwardFrames += 1;
  }
  if (shoulderTilt > 0.045) {
    poseMetrics.shoulderTiltFrames += 1;
  }
  if (noseOffset > 0.09) {
    poseMetrics.lookingAwayFrames += 1;
  }

  const now = Date.now();

  if (poseMetrics.prevLeftWrist && poseMetrics.prevRightWrist) {
    const leftDelta = Math.hypot(leftWrist.x - poseMetrics.prevLeftWrist.x, leftWrist.y - poseMetrics.prevLeftWrist.y);
    const rightDelta = Math.hypot(rightWrist.x - poseMetrics.prevRightWrist.x, rightWrist.y - poseMetrics.prevRightWrist.y);

    if ((leftDelta > 0.03 || rightDelta > 0.03) && now - poseMetrics.lastMovementTime > 450) {
      poseMetrics.wristMovementEvents += 1;
      poseMetrics.lastMovementTime = now;
    }
  }

  poseMetrics.prevLeftWrist = { x: leftWrist.x, y: leftWrist.y };
  poseMetrics.prevRightWrist = { x: rightWrist.x, y: rightWrist.y };
}

async function initPoseTracking() {
  if (!supportsPose) {
    poseSummary.textContent = "Pose tracking unavailable (MediaPipe not loaded).";
    return;
  }

  pose = new window.Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  pose.onResults((results) => {
    if (currentState === STATES.RECORDING) {
      updatePoseMetrics(results.poseLandmarks);
    }
  });
}

async function startWebcamAndPose() {
  mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  webcamVideo.srcObject = mediaStream;

  if (!supportsPose || !pose) {
    return;
  }

  camera = new window.Camera(webcamVideo, {
    onFrame: async () => {
      if (currentState === STATES.RECORDING) {
        await pose.send({ image: webcamVideo });
      }
    },
    width: 640,
    height: 360
  });

  camera.start();
}

function stopWebcamAndPose() {
  if (camera) {
    camera.stop();
    camera = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  webcamVideo.srcObject = null;
}

async function requestGeminiFeedback(transcript, bodyData) {
  const serverResponse = await fetch("/api/gemini-analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      topic: activeTopic,
      bodyData
    })
  });

  const feedbackContentType = serverResponse.headers.get("content-type") || "";
  if (!feedbackContentType.includes("application/json")) {
    throw new Error("API endpoint not reached. Open the app from the Node server URL shown in terminal.");
  }

  const serverPayload = await serverResponse.json().catch(() => ({}));
  if (!serverResponse.ok) {
    throw new Error(serverPayload?.details || serverPayload?.error || "Gemini request failed.");
  }

  return [
    "Speech",
    `- Speaking Speed: ${serverPayload.speakingSpeed || "Good pace."}`,
    `- Clarity: ${serverPayload.clarity || "Mostly clear speech."}`,
    `- Tone: ${serverPayload.tone || "Try varying pitch for engagement."}`,
    "",
    "Suggestions",
    `- ${serverPayload.suggestions || "Add a stronger opening and a clear closing."}`
  ].join("\n");
}

function toFriendlyGeminiError(message) {
  const text = String(message || "");

  if (/429|too many requests|quota|resource exhausted|rate limit/i.test(text)) {
    return [
      "Gemini request limit reached for this key/project.",
      "Wait a bit and retry, or use a key/project with available quota."
    ].join(" ");
  }

  if (/reported as leaked/i.test(text)) {
    return [
      "This Gemini API key is blocked because Google reported it as leaked.",
      "Create a new key in Google AI Studio, replace it, and try again."
    ].join(" ");
  }

  if (/not been used in project|disabled|generativelanguage\.googleapis\.com/i.test(text)) {
    return [
      "Gemini API is not enabled for this Google Cloud project.",
      "Enable it here:",
      "https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=765537643339",
      "After enabling, wait a few minutes and try again."
    ].join(" ");
  }

  return text || "Gemini request failed.";
}

async function processAndGetFeedback() {
  setRecordingUI(false);
  setState(STATES.PROCESSING);
  recordingStatus.textContent = "Processing...";

  // Show processing modal immediately
  showProcessingModal();

  const transcript = finalTranscript.trim();

  const bodyData = summarizePoseData();
  poseSummary.textContent = `Posture: ${bodyData.posture} | Gestures: ${bodyData.gesture_level} | Eye contact: ${bodyData.eye_contact}`;

  stopWebcamAndPose();

  if (!transcript || !hasSpeech) {
    transcriptBox.textContent = "No speech detected. Please try again.";
    feedbackCard.innerHTML = "<p>Feedback unavailable because no speech was detected.</p>";
    countdownText.textContent = "Done";
    setState(STATES.COMPLETED);
    recordingStatus.textContent = "Not Recording";
    hideProcessingModal();
    return;
  }

  transcriptBox.textContent = transcript;

  // Delay feedback by 3 seconds
  processingTimeout = setTimeout(async () => {
    try {
      const feedback = await requestGeminiFeedback(transcript, bodyData);
      feedbackCard.innerHTML = `<pre class="feedback-pre">${feedback}</pre>`;
    } catch (error) {
      const friendlyError = toFriendlyGeminiError(error.message);
      feedbackCard.innerHTML = `<p><strong>Error:</strong> ${friendlyError}</p>`;
    }

    hideProcessingModal();
    countdownText.textContent = "Done";
    setState(STATES.COMPLETED);
    recordingStatus.textContent = "Not Recording";
  }, 3000);
}

function stopRecordingSession(fromButton = true) {
  console.log("stopRecordingSession called. currentState:", currentState, "fromButton:", fromButton);

  if (currentState !== STATES.RECORDING) {
    console.log("Not in RECORDING state, returning");
    return;
  }

  clearTimers();

  if (recognition && fromButton) {
    console.log("Setting isRecognitionStopping = true and stopping recognition");
    isRecognitionStopping = true;
    recognition.stop();
    return;
  }

  console.log("Calling processAndGetFeedback directly");
  processAndGetFeedback();
}

async function startRecordingSession() {
  if (!supportsSpeech) {
    setState(STATES.WAITING);
    statusText.textContent = "Speech recognition unsupported in this browser.";
    return;
  }

  try {
    await startWebcamAndPose();
  } catch {
    setState(STATES.WAITING);
    statusText.textContent = "Camera access denied. Please allow webcam permission.";
    return;
  }

  finalTranscript = "";
  hasSpeech = false;
  resetPoseMetrics();
  transcriptBox.textContent = "";
  feedbackCard.innerHTML = "<p>Analyzing after recording completes...</p>";

  // Get selected speaking duration in seconds
  const speakingDurationSeconds = Number(speakingTimeSelect.value) || 120;
  const speakingDurationMs = speakingDurationSeconds * 1000;

  countdownText.textContent = formatSeconds(speakingDurationSeconds);

  setState(STATES.RECORDING);
  setRecordingUI(true);

  let remaining = speakingDurationSeconds;
  recordingInterval = setInterval(() => {
    remaining -= 1;
    countdownText.textContent = formatSeconds(remaining > 0 ? remaining : 0);
  }, 1000);

  recordingStopTimeout = setTimeout(() => {
    stopRecordingSession(true);
  }, speakingDurationMs);

  recognition.start();
}

function startThinkingTimer(seconds) {
  setState(STATES.THINKING);
  countdownText.textContent = `${seconds}s`;

  let remaining = seconds;
  thinkingInterval = setInterval(() => {
    remaining -= 1;
    countdownText.textContent = remaining > 0 ? `${remaining}s` : "0s";

    if (remaining <= 0) {
      clearInterval(thinkingInterval);
      thinkingInterval = null;
      startRecordingSession();
    }
  }, 1000);
}

async function requestTopicFromApi() {
  const response = await fetch("/api/generate-topic");
  const topicContentType = response.headers.get("content-type") || "";
  if (!topicContentType.includes("application/json")) {
    throw new Error("API endpoint not reached. Open the app from the Node server URL shown in terminal.");
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.details || payload?.error || "Failed to generate topic.");
  }

  const topic = String(payload?.topic || "").trim();
  if (!topic) {
    throw new Error("Topic API returned empty response.");
  }

  return topic;
}

function startPracticeMode(mode) {
  currentMode = mode;

  if (mode === MODES.CALL_TO_FRIEND) {
    // For Call to Friend, start a real-time conversation
    startCall();
  } else {
    // For Table Topic, call the existing generateIdea function
    generateIdea();
  }
}

// ========== CALL TO FRIEND FUNCTIONS ==========

function startCall() {
  callActive = true;
  callStartTime = Date.now();
  callConversationHistory = [];
  interimTranscript = "";

  // Show call interface, hide recording interface
  recordingArea.hidden = true;
  callInterface.hidden = false;
  conversationHistory.innerHTML = "";
  callSummarySection.hidden = true;

  // Update UI
  setState(STATES.RECORDING);
  callStatusText.textContent = "Call started. Speak to begin!";
  callMicButton.textContent = "🎤 Speak";
  callMicButton.classList.remove("recording");

  // Start call duration timer
  updateCallDuration();
  callDurationInterval = setInterval(updateCallDuration, 1000);

  // Initialize recognition for call
  if (recognition && supportsSpeech) {
    finalTranscript = "";
    hasSpeech = false;
    isRecognitionStarted = false;
  }
}

function updateCallDuration() {
  if (!callStartTime) return;
  const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  callDurationDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function addMessageToConversation(role, message) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `conversation-message ${role === 'user' ? 'message-user' : 'message-ai'}`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = message;

  messageDiv.appendChild(bubble);
  conversationHistory.appendChild(messageDiv);
  conversationHistory.scrollTop = conversationHistory.scrollHeight;

  // Also add to history for API
  if (role === 'user') {
    callConversationHistory.push({ role: 'user', content: message });
  } else {
    callConversationHistory.push({ role: 'assistant', content: message });
  }
}

async function sendCallMessage(userMessage) {
  if (!userMessage.trim() || isSpeaking) return;

  // Add user message to UI
  addMessageToConversation('user', userMessage);
  callStatusText.textContent = "AI is thinking...";
  transcriptionDisplay.textContent = "";

  try {
    const response = await fetch("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_message: userMessage,
        conversation_history: callConversationHistory
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Conversation failed");
    }

    const aiResponse = data.ai_response;
    addMessageToConversation('assistant', aiResponse);

    // Play AI response using SpeechSynthesis
    speakText(aiResponse, () => {
      callStatusText.textContent = "Your turn to speak";
      if (recognition && supportsSpeech) {
        startListeningForCall();
      }
    });
  } catch (error) {
    console.error("Conversation error:", error);
    callStatusText.textContent = "Error: " + error.message;
  }
}

function speakText(text, onEnd) {
  if (!('speechSynthesis' in window)) {
    console.error("SpeechSynthesis not supported");
    if (onEnd) onEnd();
    return;
  }

  isSpeaking = true;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  utterance.onend = () => {
    isSpeaking = false;
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.error("Speech synthesis error:", e);
    isSpeaking = false;
    if (onEnd) onEnd();
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function startListeningForCall() {
  if (!recognition || !supportsSpeech || isListening) return;

  isListening = true;
  finalTranscript = "";
  interimTranscript = "";
  callMicButton.textContent = "🔴 Listening...";
  callMicButton.classList.add("recording");

  try {
    recognition.start();
  } catch (e) {
    console.debug("Recognition already started or error:", e);
  }
}

function stopListeningForCall() {
  if (!recognition || !isListening) return;

  isListening = false;
  callMicButton.textContent = "🎤 Speak";
  callMicButton.classList.remove("recording");

  try {
    recognition.stop();
  } catch (e) {
    console.debug("Recognition stop error:", e);
  }
}

function endCall() {
  callActive = false;
  isListening = false;
  isSpeaking = false;

  // Clear intervals and recognition
  if (callDurationInterval) {
    clearInterval(callDurationInterval);
    callDurationInterval = null;
  }

  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      // Ignore
    }
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // Show summary
  const callDuration = Math.floor((Date.now() - callStartTime) / 1000);
  const turns = Math.floor(callConversationHistory.length / 2);
  callSummaryText.textContent = `Great practice! You had a ${callDuration}-second conversation with ${turns} turns. Well done!`;
  callSummarySection.hidden = false;
  callStatusText.textContent = "Call ended";

  // Hide mic button, show reset option
  callMicButton.hidden = true;
  hangUpButton.hidden = true;

  setState(STATES.COMPLETED);
}

async function initCallRecognition() {
  if (!supportsSpeech) return;

  // Override the recognition handlers for call mode
  recognition.onstart = () => {
    isRecognitionStarted = true;
  };

  recognition.onresult = (event) => {
    interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
        hasSpeech = true;
      } else {
        interimTranscript += transcript;
      }
    }

    // Update display
    const displayText = (finalTranscript + interimTranscript).trim();
    transcriptionDisplay.textContent = displayText;
    transcriptionDisplay.classList.toggle("active", displayText.length > 0);
  };

  recognition.onend = () => {
    if (callActive && isListening && finalTranscript.trim()) {
      // Send the message
      stopListeningForCall();
      const message = finalTranscript.trim();
      finalTranscript = "";
      sendCallMessage(message);
    } else if (callActive && isListening) {
      // Restart listening if no speech detected
      console.debug("No speech detected, restarting...");
      try {
        recognition.start();
      } catch (e) {
        console.debug("Recognition restart error:", e);
      }
    }
  };

  recognition.onerror = (event) => {
    console.debug("Speech recognition error:", event.error);
  };
}

async function generateIdea() {
  if (currentState === STATES.THINKING || currentState === STATES.RECORDING || currentState === STATES.PROCESSING) {
    return;
  }

  setState(STATES.PROCESSING);
  countdownText.textContent = "--";
  topicBox.textContent = "Generating topic from API...";

  try {
    activeTopic = await requestTopicFromApi();
  } catch (error) {
    const friendlyError = toFriendlyGeminiError(error.message);
    setState(STATES.WAITING);
    topicBox.textContent = `Unable to generate topic from API: ${friendlyError}`;
    feedbackCard.innerHTML = `<p><strong>Error:</strong> ${friendlyError}</p>`;
    return;
  }

  topicBox.textContent = activeTopic;
  poseSummary.textContent = "Body data will appear after recording.";
  transcriptBox.textContent = "";
  feedbackCard.innerHTML = "<p>Feedback will appear after a completed session.</p>";
  recordingStatus.textContent = "Not Recording";

  const thinkSeconds = Number(thinkingTimeSelect.value) || 15;
  startThinkingTimer(thinkSeconds);
}

function resetSession() {
  clearTimers();

  if (recognition) {
    try {
      isRecognitionStopping = false;
      recognition.stop();
    } catch {
      // Ignore when recognition is already stopped.
    }
  }

  // Reset call state
  callActive = false;
  isListening = false;
  isSpeaking = false;
  if (callDurationInterval) {
    clearInterval(callDurationInterval);
    callDurationInterval = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  stopWebcamAndPose();
  resetPoseMetrics();

  activeTopic = "";
  currentMode = null;
  finalTranscript = "";
  hasSpeech = false;
  callConversationHistory = [];

  // Reset UI
  recordingArea.hidden = false;
  callInterface.hidden = true;
  callMicButton.hidden = false;
  hangUpButton.hidden = false;
  callSummarySection.hidden = true;

  topicBox.textContent = "Click Start Speaking to generate your topic.";
  countdownText.textContent = "--";
  transcriptBox.textContent = "Your speech transcript will appear here.";
  poseSummary.textContent = "Body data will appear after recording.";
  feedbackCard.innerHTML = "<p>Feedback will appear after a completed session.</p>";

  setRecordingUI(false);
  recordingStatus.textContent = "Not Recording";
  setState(STATES.WAITING);

  // Show start screen
  showStartScreen();
}

async function initApp() {
  initSpeechRecognition();
  initCallRecognition();
  await initPoseTracking();

  // Show start screen on page load instead of going to WAITING state
  showStartScreen();

  if (!supportsSpeech) {
    statusText.textContent = "Speech recognition unsupported in this browser.";
  }
}

initApp();

generateButton.addEventListener("click", generateIdea);
resetButton.addEventListener("click", resetSession);
stopRecordingButton.addEventListener("click", () => {
  console.log("Stop recording button clicked!");
  stopRecordingSession(true);
});

tableTopic_btn.addEventListener("click", () => {
  hideStartScreen();
  setState(STATES.WAITING);
  startPracticeMode(MODES.TABLE_TOPIC);
});

callFriend_btn.addEventListener("click", () => {
  hideStartScreen();
  setState(STATES.WAITING);
  startPracticeMode(MODES.CALL_TO_FRIEND);
});

callMicButton.addEventListener("click", () => {
  if (!callActive) return;

  if (isListening) {
    stopListeningForCall();
  } else {
    startListeningForCall();
  }
});

hangUpButton.addEventListener("click", () => {
  endCall();
});
