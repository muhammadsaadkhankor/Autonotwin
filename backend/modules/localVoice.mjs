import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);
dotenv.config();

const VOICE_CLONER_URL = process.env.VOICE_CLONER_URL || "http://localhost:7007";
const VOICE_CLONER_API_KEY = process.env.VOICE_CLONER_API_KEY || "";
const VOICE_CLONER_VOICE_ID = process.env.VOICE_CLONER_VOICE_ID || "";

async function generateSpeechLocal(text, outputFileName) {
  console.log(`Generating speech with local voice cloner: "${text.substring(0, 50)}..."`);

  const response = await axios.post(
    `${VOICE_CLONER_URL}/api/tts`,
    { voice_id: VOICE_CLONER_VOICE_ID, text, output_dir: "dtalk_audio" },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: VOICE_CLONER_API_KEY,
      },
    }
  );

  const correctedUrl = response.data.audio_url.replace(/http:\/\/localhost:\d+/, VOICE_CLONER_URL);
  const audioResponse = await axios.get(correctedUrl, { responseType: "arraybuffer" });
  const audioBuffer = Buffer.from(audioResponse.data);

  const outputDir = path.dirname(outputFileName);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const tempWavPath = outputFileName.replace(".mp3", "_temp.wav");
  fs.writeFileSync(tempWavPath, audioBuffer);
  await execPromise(`ffmpeg -y -i ${tempWavPath} -codec:a libmp3lame -qscale:a 2 ${outputFileName}`);
  fs.unlinkSync(tempWavPath);

  console.log("Audio saved to:", outputFileName);
  return audioBuffer;
}

export { generateSpeechLocal };
