import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

function extractGeminiText(responseJson) {
  return (
    responseJson?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim() || ""
  );
}

function safeParseFeedback(text) {
  try {
    const parsed = JSON.parse(text);
    return {
      speakingSpeed: parsed.speakingSpeed || "Good pace.",
      clarity: parsed.clarity || "Mostly clear speech.",
      tone: parsed.tone || "Try varying pitch for engagement.",
      suggestions: parsed.suggestions || "Add a stronger opening and a clear closing."
    };
  } catch {
    return {
      speakingSpeed: "Good pace.",
      clarity: "Mostly clear speech.",
      tone: "Try varying pitch for engagement.",
      suggestions: "Add a stronger opening and a clear closing."
    };
  }
}

app.post("/api/gemini-analyze", async (req, res) => {
  const transcript = String(req.body?.transcript || "").trim();
  const topic = String(req.body?.topic || "").trim();

  if (!transcript) {
    return res.status(400).json({ error: "Missing transcript" });
  }

  if (!geminiApiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set on server." });
  }

  const prompt = [
    "You are a Toastmasters speaking coach.",
    "Analyze this short practice transcript and return concise feedback as JSON only.",
    "JSON schema:",
    '{"speakingSpeed":"...","clarity":"...","tone":"...","suggestions":"..."}',
    "Rules:",
    "- Max 1 short sentence per field.",
    "- Be constructive and beginner-friendly.",
    "- No markdown, no extra keys.",
    `Topic: ${topic || "N/A"}`,
    `Transcript: ${transcript}`
  ].join("\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: "Gemini API request failed.",
        details: data?.error?.message || "Unknown Gemini error",
        model: geminiModel
      });
    }

    const text = extractGeminiText(data);
    const feedback = safeParseFeedback(text);
    return res.json(feedback);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to analyze transcript.",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Sakash Voice running at http://localhost:${port}`);
});
