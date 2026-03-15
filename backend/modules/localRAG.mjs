import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const LOCAL_RAG_URL = process.env.LOCAL_RAG_URL || "http://localhost:5000";
const LOCAL_RAG_API_KEY = process.env.LOCAL_RAG_API_KEY || "";

function splitIntoMessages(text, maxLength = 200) {
  if (text.length <= maxLength) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const messages = [];
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > maxLength && current) {
      messages.push(current.trim());
      current = s;
    } else {
      current += s;
    }
    if (messages.length >= 2) break;
  }
  if (current) messages.push(current.trim());
  return messages.slice(0, 3);
}

function determineFacialExpression(text) {
  const t = text.toLowerCase();
  if (t.includes("unfortunately") || t.includes("sorry")) return "sad";
  if (t.includes("!") || t.includes("exciting") || t.includes("amazing")) return "surprised";
  if (t.includes("happy") || t.includes("great") || t.includes("excellent")) return "smile";
  return "default";
}

function determineAnimation(index, total) {
  return index === 0 ? "TalkingOne" : index === total - 1 ? "TalkingThree" : "TalkingOne";
}

async function callLocalRAG(question) {
  const response = await axios.post(
    `${LOCAL_RAG_URL}/api/v1/chat`,
    { message: question },
    {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": LOCAL_RAG_API_KEY,
      },
    }
  );
  const messages = splitIntoMessages(response.data.answer);
  return {
    messages: messages.map((text, i) => ({
      text,
      facialExpression: determineFacialExpression(text),
      animation: determineAnimation(i, messages.length),
    })),
  };
}

const localRAGChain = {
  invoke: async ({ question }) => callLocalRAG(question),
};

export { localRAGChain, callLocalRAG };
