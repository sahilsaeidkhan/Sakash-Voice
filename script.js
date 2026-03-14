const generateButton = document.getElementById("generateButton");
const resetButton = document.getElementById("resetButton");
const thinkingTimeSelect = document.getElementById("thinkingTime");
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
const feedbackCard = document.getElementById("feedbackCard");

const STATES = {
  WAITING: "Waiting",
  THINKING: "Thinking",
  RECORDING: "Recording",
  PROCESSING: "Processing",
  COMPLETED: "Completed"
};

const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
const supportsSpeech = Boolean(SpeechRecognitionClass);
const supportsPose = typeof window.Pose === "function";

let currentState = STATES.WAITING;
let activeTopic = "";

let thinkingInterval = null;
let recordingInterval = null;
let recordingStopTimeout = null;

let recognition = null;
let isRecognitionStopping = false;
let finalTranscript = "";
let hasSpeech = false;

let camera = null;
let mediaStream = null;
let pose = null;

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

  const busy = state === STATES.THINKING || state === STATES.RECORDING || state === STATES.PROCESSING;
  generateButton.disabled = busy;
  thinkingTimeSelect.disabled = busy;

  if (state !== STATES.RECORDING) {
    stopRecordingButton.hidden = true;
    stopRecordingButton.disabled = true;
  }
}

function setRecordingUI(isRecording) {
  micButton.classList.toggle("recording", isRecording);
  waveform.classList.toggle("active", isRecording);
  micLabel.textContent = isRecording ? "Recording" : "Idle";
  recordingStatus.textContent = isRecording ? "Recording..." : "Not Recording";

  if (isRecording) {
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
}

function initSpeechRecognition() {
  if (!supportsSpeech) {
    return;
  }

  recognition = new SpeechRecognitionClass();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

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
    // Ignore network errors - they're usually temporary
    if (event.error === "network") {
      return;
    }

    if (currentState === STATES.RECORDING) {
      // Try to restart on other errors
      try {
        recognition.start();
      } catch {
        stopRecordingSession(false);
      }
    }
  };

  recognition.onend = () => {
    if (isRecognitionStopping) {
      isRecognitionStopping = false;
      processAndGetFeedback();
      return;
    }

    // Auto-restart recognition if it ends during recording (due to silence timeout)
    if (currentState === STATES.RECORDING) {
      try {
        recognition.start();
      } catch {
        // If start fails, stop the session
        stopRecordingSession(false);
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
    return;
  }

  transcriptBox.textContent = transcript;

  try {
    const feedback = await requestGeminiFeedback(transcript, bodyData);
    feedbackCard.innerHTML = `<pre class=\"feedback-pre\">${feedback}</pre>`;
  } catch (error) {
    const friendlyError = toFriendlyGeminiError(error.message);
    feedbackCard.innerHTML = `<p><strong>Error:</strong> ${friendlyError}</p>`;
  }

  countdownText.textContent = "Done";
  setState(STATES.COMPLETED);
  recordingStatus.textContent = "Not Recording";
}

function stopRecordingSession(fromButton = true) {
  if (currentState !== STATES.RECORDING) {
    return;
  }

  clearTimers();

  if (recognition && fromButton) {
    isRecognitionStopping = true;
    recognition.stop();
    return;
  }

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
  countdownText.textContent = "60s";

  setState(STATES.RECORDING);
  setRecordingUI(true);

  let remaining = 60;
  recordingInterval = setInterval(() => {
    remaining -= 1;
    countdownText.textContent = remaining > 0 ? `${remaining}s` : "0s";
  }, 1000);

  recordingStopTimeout = setTimeout(() => {
    stopRecordingSession(true);
  }, 60000);

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

  stopWebcamAndPose();
  resetPoseMetrics();

  activeTopic = "";
  finalTranscript = "";
  hasSpeech = false;

  topicBox.textContent = "Click Generate Idea to get a Table Topics prompt from API.";
  countdownText.textContent = "--";
  transcriptBox.textContent = "Your speech transcript will appear here.";
  poseSummary.textContent = "Body data will appear after recording.";
  feedbackCard.innerHTML = "<p>Feedback will appear after a completed session.</p>";

  setRecordingUI(false);
  recordingStatus.textContent = "Not Recording";
  setState(STATES.WAITING);
}

async function initApp() {
  initSpeechRecognition();
  await initPoseTracking();
  setState(STATES.WAITING);

  if (!supportsSpeech) {
    statusText.textContent = "Speech recognition unsupported in this browser.";
  }
}

initApp();

generateButton.addEventListener("click", generateIdea);
resetButton.addEventListener("click", resetSession);
stopRecordingButton.addEventListener("click", () => stopRecordingSession(true));
