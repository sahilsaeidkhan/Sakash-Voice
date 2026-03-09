import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const preferredPort = Number(process.env.PORT) || 3000;
const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModels = (process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || "gemini-2.0-flash")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
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

function cleanGeneratedTopic(text) {
  const singleLine = String(text || "").replace(/\s+/g, " ").trim();
  const trimmed = singleLine.replace(/^[-*\d.\s]+/, "").replace(/^"|"$/g, "").trim();
  return trimmed;
}

async function requestGeminiText(prompt, generationConfig = {}) {
  let lastErrorDetails = "Unknown Gemini error";
  let lastModelTried = geminiModels[0] || "unknown";

  for (const model of geminiModels) {
    lastModelTried = model;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
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
            generationConfig
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        lastErrorDetails = data?.error?.message || "Unknown Gemini error";
        console.error(`Gemini error [${model}] (${response.status}):`, lastErrorDetails);
        continue;
      }

      return {
        text: extractGeminiText(data),
        model
      };
    } catch (error) {
      lastErrorDetails = error instanceof Error ? error.message : "Unknown Gemini error";
    }
  }

  throw {
    message: "Gemini API request failed.",
    details: lastErrorDetails,
    model: lastModelTried
  };
}

app.get("/api/generate-topic", async (req, res) => {
  if (!geminiApiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set on server." });
  }

  const prompt = [
    "You create Toastmasters Table Topics prompts.",
    "Generate exactly one concise speaking prompt for a 1-minute impromptu speech.",
    "Rules:",
    "- Return plain text only.",
    "- No numbering, no markdown, no quotes.",
    "- Max 18 words.",
    "- Friendly and thought-provoking."
  ].join("\n");

  try {
    const result = await requestGeminiText(prompt, { temperature: 0.9 });
    const topic = cleanGeneratedTopic(result.text);
    if (!topic) {
      return res.status(502).json({ error: "Gemini returned an empty topic." });
    }

    return res.json({ topic });
  } catch (error) {
    if (error?.message === "Gemini API request failed.") {
      return res.status(502).json({
        error: error.message,
        details: error.details || "Unknown Gemini error",
        model: error.model || "unknown"
      });
    }

    return res.status(500).json({
      error: "Failed to generate topic.",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

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
    const result = await requestGeminiText(prompt, {
      temperature: 0.4,
      responseMimeType: "application/json"
    });
    const text = result.text;
    const feedback = safeParseFeedback(text);
    return res.json(feedback);
  } catch (error) {
    if (error?.message === "Gemini API request failed.") {
      return res.status(502).json({
        error: error.message,
        details: error.details || "Unknown Gemini error",
        model: error.model || "unknown"
      });
    }

    return res.status(500).json({
      error: "Failed to analyze transcript.",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.use("/api", (req, res) => {
  return res.status(404).json({ error: "API route not found." });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Sakash Voice running at http://localhost:${port}`);
  });

  server.on("error", (error) => {
    if (error?.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy. Retrying on ${nextPort}...`);
      startServer(nextPort);
      return;
    }

    console.error("Server failed to start:", error);
    process.exit(1);
  });
}

startServer(preferredPort);
