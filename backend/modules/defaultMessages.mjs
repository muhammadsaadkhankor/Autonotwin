import { audioFileToBase64, readJsonTranscript } from "../utils/files.mjs";
import dotenv from "dotenv";
dotenv.config();

const openAIApiKey = process.env.OPENAI_API_KEY;
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;

async function sendDefaultMessages({ userMessage }) {
  if (!userMessage) {
    return [
      {
        text: "Hey there... How was your day?",
        audio: await audioFileToBase64({ fileName: "audios/intro_0.wav" }),
        lipsync: await readJsonTranscript({ fileName: "audios/intro_0.json" }),
        facialExpression: "smile",
        animation: "TalkingOne",
      },
      {
        text: "I'm Professor Abed, your personal AI assistant. I'm here to help you with anything you need.",
        audio: await audioFileToBase64({ fileName: "audios/intro_1.wav" }),
        lipsync: await readJsonTranscript({ fileName: "audios/intro_1.json" }),
        facialExpression: "smile",
        animation: "TalkingTwo",
      },
    ];
  }

  if (!elevenLabsApiKey || openAIApiKey === "<your-openai-api-key>") {
    return [
      {
        text: "Please don't forget to add your API keys!",
        audio: await audioFileToBase64({ fileName: "audios/api_0.wav" }),
        lipsync: await readJsonTranscript({ fileName: "audios/api_0.json" }),
        facialExpression: "angry",
        animation: "TalkingThree",
      },
    ];
  }

  return null;
}

const defaultResponse = [
  {
    text: "I'm sorry, there seems to be an error. Could you please repeat your question?",
    facialExpression: "sad",
    animation: "Idle",
  },
];

export { sendDefaultMessages, defaultResponse };
