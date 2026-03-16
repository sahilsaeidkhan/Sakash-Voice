import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const preferredPort = Number(process.env.PORT) || 3000;
const geminiApiKey = process.env.GEMINI_API_KEY;
const openrouterApiKey = process.env.OPENROUTER_API_KEY;
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

async function requestGrokText(prompt) {
  if (!openrouterApiKey) {
    throw {
      message: "Grok API not configured.",
      details: "OPENROUTER_API_KEY is not set"
    };
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterApiKey}`,
        "HTTP-Referer": "http://localhost:3000"
      },
      body: JSON.stringify({
        model: "arcee-ai/trinity-large-preview:free",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 1.0,
        max_tokens: 256
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorDetails = data?.error?.message || "Unknown error";
      console.error(`OpenRouter error (${response.status}):`, errorDetails);
      throw {
        message: "Grok API request failed.",
        details: errorDetails,
        model: "arcee-ai/trinity-large-preview:free"
      };
    }

    //Try to get content from message, or fallback to extracting from reasoning
    let content = data?.choices?.[0]?.message?.content || "";

    // If content is null/empty but reasoning exists, try to extract answer from reasoning
    if (!content && data?.choices?.[0]?.message?.reasoning) {
      const reasoning = data.choices[0].message.reasoning;
      // Look for quoted text or final answer patterns in reasoning
      const matches = reasoning.match(/(?:like|something|idea|prompt|answer):\s*["\']?([^"'\n]+)["\']?/i) ||
                      reasoning.match(/Let's\s+(?:create|craft|build):\s*["\']?([^"'\n.]+)["\']?/i) ||
                      reasoning.match(/["\']([^"']+)["\']\.?\s*(?:Count words|That's|This is)/i);
      if (matches && matches[1]) {
        content = matches[1].trim();
      }
    }

    console.log("[OpenRouter Response] Status:", response.status, "Content length:", content.length, "Has reasoning:", !!data?.choices?.[0]?.message?.reasoning);
    return {
      text: content,
      model: "arcee-ai/trinity-large-preview:free"
    };
  } catch (error) {
    if (error?.message === "Grok API request failed.") {
      throw error;
    }
    const errorDetails = error instanceof Error ? error.message : "Unknown error";
    throw {
      message: "Grok API request failed.",
      details: errorDetails,
      model: "arcee-ai/trinity-large-preview:free"
    };
  }
}

app.get("/api/generate-topic", async (req, res) => {
  if (!geminiApiKey && !openrouterApiKey) {
    return res.status(500).json({ error: "No API keys configured (GEMINI_API_KEY or OPENROUTER_API_KEY)" });
  }

  const categories = [
    "philosophical or ethical dilemma",
    "creative or imaginative scenario",
    "personal growth or reflection",
    "hypothetical situation or adventure",
    "opinion or debate topic",
    "describe an experience or memory",
    "future prediction or innovation",
    "life lesson or wisdom",
    "unexpected challenge or problem-solving",
    "profession or career-related thought"
  ];

  const perspectives = [
    "from the perspective of a time traveler",
    "as if you were an alien observing Earth",
    "from the viewpoint of someone 100 years in the future",
    "from a completely unexpected angle",
    "as if you were explaining it to a beginner",
    "in the most creative way possible"
  ];

  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
  const randomSeed = Math.random().toString(36).substring(7);

  const prompt = [
    "You create Toastmasters Table Topics prompts.",
    `Generate exactly one UNIQUE Table Topics prompt about: ${randomCategory}`,
    `Think ${randomPerspective}`,
    `Generation ID: ${randomSeed} (Use this to vary your response)`,
    "Generate a 1-minute impromptu speech prompt.",
    "Rules:",
    "- Return plain text only.",
    "- No numbering, no markdown, no quotes.",
    "- Max 18 words.",
    "- Friendly and thought-provoking.",
    "- NEVER repeat similar topics.",
    "- Avoid: daily habits, morning routines, small improvements, meditation, exercise",
    "- Make it COMPLETELY DIFFERENT from:",
    "  (personal growth, life lessons, self-help, productivity advice)"
  ].join("\n");

  try {
    let result;

    // Try Gemini first with maximum temperature
    if (geminiApiKey) {
      try {
        result = await requestGeminiText(prompt, { temperature: 1.0 });
      } catch (error) {
        console.warn("Gemini failed, trying Grok...", error?.message);
        if (openrouterApiKey) {
          result = await requestGrokText(prompt);
        } else {
          throw error;
        }
      }
    } else {
      // Use Grok if Gemini not available
      result = await requestGrokText(prompt);
    }

    const topic = cleanGeneratedTopic(result.text);
    console.log("Generated topic:", topic, "from model:", result.model);
    if (!topic) {
      console.warn("Empty topic returned, result text was:", result.text);
      return res.status(502).json({ error: "API returned an empty topic." });
    }

    return res.json({ topic, model: result.model });
  } catch (error) {
    if (error?.message === "Gemini API request failed." || error?.message === "Grok API request failed.") {
      return res.status(502).json({
        error: error.message,
        details: error.details || "Unknown error",
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

  if (!geminiApiKey && !openrouterApiKey) {
    return res.status(500).json({ error: "No API keys configured (GEMINI_API_KEY or OPENROUTER_API_KEY)" });
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
    let result;

    // Try Gemini first
    if (geminiApiKey) {
      try {
        result = await requestGeminiText(prompt, {
          temperature: 0.4,
          responseMimeType: "application/json"
        });
      } catch (error) {
        console.warn("Gemini failed, trying Grok...", error?.message);
        if (openrouterApiKey) {
          result = await requestGrokText(prompt);
        } else {
          throw error;
        }
      }
    } else {
      // Use Grok if Gemini not available
      result = await requestGrokText(prompt);
    }

    const text = result.text;
    const feedback = safeParseFeedback(text);
    return res.json(feedback);
  } catch (error) {
    if (error?.message === "Gemini API request failed." || error?.message === "Grok API request failed.") {
      return res.status(502).json({
        error: error.message,
        details: error.details || "Unknown error",
        model: error.model || "unknown"
      });
    }

    return res.status(500).json({
      error: "Failed to analyze transcript.",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.post("/api/conversation", async (req, res) => {
  const userMessage = String(req.body?.user_message || "").trim();
  const conversationHistory = Array.isArray(req.body?.conversation_history) ? req.body.conversation_history : [];

  if (!userMessage) {
    return res.status(400).json({ error: "Missing user_message" });
  }

  if (!geminiApiKey && !openrouterApiKey) {
    return res.status(500).json({ error: "No API keys configured" });
  }

  try {
    // Build conversation prompt for Gemini
    const systemPrompt = [
      "You are a friendly AI companion for practicing conversations.",
      "You're helping someone practice natural English speaking.",
      "Rules:",
      "- Be warm, encouraging, and natural.",
      "- Ask follow-up questions to keep conversation flowing.",
      "- Keep responses short (1-3 sentences max).",
      "- Correct gently if needed, but focus on encouragement.",
      "- Don't use markdown or special formatting.",
      "- Respond naturally as if in a phone call."
    ].join("\n");

    // Build the conversation payload for Gemini
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      {
        role: "user",
        parts: [{ text: userMessage }]
      }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModels[0]}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: {
            instructions: systemPrompt
          },
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 256
          }
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.error?.message || "Unknown Gemini error";
      console.error("Gemini API error:", errorMessage);
      return res.status(502).json({
        error: "Conversation API failed",
        details: errorMessage
      });
    }

    const aiResponse = extractGeminiText(data);

    if (!aiResponse) {
      return res.status(502).json({
        error: "Gemini returned empty response"
      });
    }

    return res.json({
      ai_response: aiResponse,
      turn_number: Math.floor(conversationHistory.length / 2) + 1,
      session_extended: true
    });
  } catch (error) {
    console.error("Conversation error:", error);
    return res.status(500).json({
      error: "Failed to process conversation",
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
