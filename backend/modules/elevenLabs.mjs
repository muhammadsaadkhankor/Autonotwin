import ElevenLabs from "elevenlabs-node";
import dotenv from "dotenv";
import { generateSpeechLocal } from "./localVoice.mjs";

dotenv.config();

const USE_LOCAL_VOICE = process.env.USE_LOCAL_VOICE === "true";
console.log("USE_LOCAL_VOICE:", USE_LOCAL_VOICE);

let voice;

export const initializeElevenLabs = () => {
  if (!USE_LOCAL_VOICE) {
    voice = new ElevenLabs({
      apiKey: process.env.ELEVEN_LABS_API_KEY,
      voiceId: process.env.ELEVEN_LABS_VOICE_ID,
    });
  }
};

initializeElevenLabs();

export async function convertTextToSpeech({ text, fileName }) {
  if (USE_LOCAL_VOICE) {
    await generateSpeechLocal(text, fileName);
  } else {
    await voice.textToSpeech({
      fileName,
      textInput: text,
      voiceId: process.env.ELEVEN_LABS_VOICE_ID,
      stability: 0.5,
      similarityBoost: 0.5,
      modelId: process.env.ELEVEN_LABS_MODEL_ID,
      style: 1,
      speakerBoost: true,
    });
  }
}

export { voice };
