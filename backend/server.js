import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs/promises";
import { openAIChain, parser } from "./modules/openAI.mjs";
import { localRAGChain } from "./modules/localRAG.mjs";
import { lipSync } from "./modules/lip-sync.mjs";
import { sendDefaultMessages, defaultResponse } from "./modules/defaultMessages.mjs";
import { voice, initializeElevenLabs } from "./modules/elevenLabs.mjs";

dotenv.config();

const USE_LOCAL_RAG = process.env.USE_LOCAL_RAG === "true";
console.log("USE_LOCAL_RAG:", USE_LOCAL_RAG);

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors());
const port = 3000;

function normalizeOpenAIResponse(response) {
  if (Array.isArray(response)) return { messages: response };
  if (response?.messages && Array.isArray(response.messages)) return response;
  if (response && typeof response === "object") {
    for (const key in response) {
      if (Array.isArray(response[key])) return { messages: response[key] };
    }
  }
  return { messages: defaultResponse };
}

app.get("/settings", async (req, res) => {
  try {
    res.json({
      openaiModel: process.env.OPENAI_MODEL,
      elevenLabsVoiceId: process.env.ELEVEN_LABS_VOICE_ID,
      elevenLabsModelId: process.env.ELEVEN_LABS_MODEL_ID,
      useLocalRag: process.env.USE_LOCAL_RAG,
      useLocalVoice: process.env.USE_LOCAL_VOICE,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get settings" });
  }
});

app.post("/settings", async (req, res) => {
  try {
    const s = req.body;
    let currentEnv = {};
    try {
      const content = await fs.readFile(".env", "utf-8");
      content.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) currentEnv[key.trim()] = value.trim();
      });
    } catch {}

    const envContent = `OPENAI_MODEL=${s.openaiModel || currentEnv.OPENAI_MODEL || "gpt-4"}
OPENAI_API_KEY=${s.openaiApiKey || currentEnv.OPENAI_API_KEY || ""}
ELEVEN_LABS_API_KEY=${s.elevenLabsApiKey || currentEnv.ELEVEN_LABS_API_KEY || ""}
ELEVEN_LABS_VOICE_ID=${s.elevenLabsVoiceId || currentEnv.ELEVEN_LABS_VOICE_ID || ""}
ELEVEN_LABS_MODEL_ID=${s.elevenLabsModelId || currentEnv.ELEVEN_LABS_MODEL_ID || "eleven_multilingual_v1"}
LOCAL_RAG_URL=${currentEnv.LOCAL_RAG_URL || "http://localhost:5000"}
LOCAL_RAG_API_KEY=${currentEnv.LOCAL_RAG_API_KEY || ""}
USE_LOCAL_RAG=${currentEnv.USE_LOCAL_RAG || "true"}
VOICE_CLONER_URL=${currentEnv.VOICE_CLONER_URL || "http://localhost:7007"}
VOICE_CLONER_API_KEY=${currentEnv.VOICE_CLONER_API_KEY || ""}
VOICE_CLONER_VOICE_ID=${currentEnv.VOICE_CLONER_VOICE_ID || ""}
USE_LOCAL_VOICE=${currentEnv.USE_LOCAL_VOICE || "true"}
`;
    await fs.writeFile(".env", envContent);
    Object.entries(s).forEach(([k, v]) => { if (v) process.env[k] = v; });
    initializeElevenLabs();
    res.json({ message: "Settings updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

app.post("/tts", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const defaults = await sendDefaultMessages({ userMessage });
    if (defaults) return res.send({ messages: defaults });

    let openAIResponse;
    try {
      if (USE_LOCAL_RAG) {
        console.log("Using Local RAG for:", userMessage);
        openAIResponse = await localRAGChain.invoke({ question: userMessage });
      } else {
        console.log("Using OpenAI for:", userMessage);
        openAIResponse = await openAIChain.invoke({
          question: userMessage,
          format_instructions: parser.getFormatInstructions(),
        });
      }
      openAIResponse = normalizeOpenAIResponse(openAIResponse);
    } catch (error) {
      console.error("AI Error:", error);
      if (error.llmOutput) {
        try {
          const raw = JSON.parse(error.llmOutput);
          openAIResponse = Array.isArray(raw) ? { messages: raw } : { messages: defaultResponse };
        } catch {
          openAIResponse = { messages: defaultResponse };
        }
      } else {
        openAIResponse = { messages: defaultResponse };
      }
    }

    const processedMessages = await lipSync({ messages: openAIResponse.messages });
    res.send({ messages: processedMessages });
  } catch (error) {
    console.error("Error:", error);
    try {
      const fallback = await lipSync({
        messages: [{ text: "I'm sorry, could you please try again?", facialExpression: "sad", animation: "Idle" }],
      });
      res.send({ messages: fallback });
    } catch {
      res.status(500).send({ error: "Failed to process response" });
    }
  }
});

app.post("/sts", async (req, res) => {
  try {
    const base64Audio = req.body.audio;
    const audioData = Buffer.from(base64Audio, "base64");

    let openAIResponse;
    try {
      openAIResponse = await openAIChain.invoke({
        question: req.body.transcribedText || "Hello",
        format_instructions: parser.getFormatInstructions(),
      });
      openAIResponse = normalizeOpenAIResponse(openAIResponse);
    } catch {
      openAIResponse = { messages: defaultResponse };
    }

    const processedMessages = await lipSync({ messages: openAIResponse.messages });
    res.send({ messages: processedMessages });
  } catch (error) {
    console.error("Error in STS:", error);
    res.status(500).json({ error: "Failed to process speech" });
  }
});

app.listen(port, () => {
  console.log(`DTalk UI backend listening on port ${port}`);
});
