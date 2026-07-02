import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

app.use(express.json());

// Lazy-loaded Google Gen AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please add it in the Settings > Secrets menu.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. AI BIO GENERATOR
app.post("/api/ai/bio", async (req, res) => {
  try {
    const { tone, keywords, currentBio } = req.body;
    const ai = getGeminiClient();

    const prompt = `You are an expert copywriter for creators and influencers. 
Generate a short, engaging, and premium profile bio for a "Link-in-Bio" page.
Tone requested: ${tone || "creative, professional"}.
Keywords or context to include: ${keywords || "design, technology, coding"}.
Current bio to optimize (optional): "${currentBio || ""}".

Rules:
- Keep the bio short, punchy, and modern (max 160 characters).
- Use natural phrasing and 1-2 relevant emojis max.
- Do not wrap the response in quotes or markdown. Just return the raw text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ success: true, bio: response.text?.trim() });
  } catch (err: any) {
    console.error("AI Bio generation failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. AI USERNAME GENERATOR
app.post("/api/ai/username", async (req, res) => {
  try {
    const { name, niche } = req.body;
    const ai = getGeminiClient();

    const prompt = `Generate a list of 5 creative, catchy, and professional usernames for a content creator.
Creator Name/Concept: ${name || "Anonymous Creator"}
Niche/Interests: ${niche || "lifestyle, travel, tech"}

Rules:
- Give exactly 5 options.
- The usernames must be clean, lowercase, and contain only letters, numbers, and underscores (no spaces or other special chars).
- Do not output numbering or markdown. Output them as a JSON array of strings. For example: ["user_one", "user_two", "user_three", "user_four", "user_five"]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    const usernames = JSON.parse(response.text?.trim() || "[]");
    res.json({ success: true, usernames });
  } catch (err: any) {
    console.error("AI Username generation failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. AI THEME GENERATOR
app.post("/api/ai/theme", async (req, res) => {
  try {
    const { themePrompt } = req.body;
    const ai = getGeminiClient();

    const prompt = `Generate a modern, highly aesthetic Tailwind-friendly custom color palette and theme design based on this prompt: "${themePrompt || "cyberpunk neon night"}"
The response must be valid JSON containing details for building a custom theme on a creator profile page.

Output JSON schema must have these exact keys and values:
{
  "themeName": "A creative, premium name for this theme (e.g., Cyberpunk Dusk)",
  "background": "CSS background class (e.g., 'bg-slate-950 text-white' or 'bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950')",
  "cardBg": "A glassmorphism/card container background style class (e.g., 'bg-white/10 backdrop-blur-md border border-white/20')",
  "primaryBtn": "Primary button styles (e.g., 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg')",
  "secondaryBtn": "Secondary button style class (e.g., 'bg-white/5 hover:bg-white/10 border border-white/10')",
  "accentColor": "A Tailwind text/border color class (e.g., 'text-teal-400' or 'text-purple-400')"
}

Ensure contrast levels are extremely high and visually premium (no muddy colors or illegible text combos). No extra commentary or markdown formatting outside of the valid JSON structure.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            themeName: { type: Type.STRING },
            background: { type: Type.STRING },
            cardBg: { type: Type.STRING },
            primaryBtn: { type: Type.STRING },
            secondaryBtn: { type: Type.STRING },
            accentColor: { type: Type.STRING },
          },
          required: ["themeName", "background", "cardBg", "primaryBtn", "secondaryBtn", "accentColor"],
        },
      },
    });

    const themeData = JSON.parse(response.text?.trim() || "{}");
    res.json({ success: true, theme: themeData });
  } catch (err: any) {
    console.error("AI Theme generation failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default app;
