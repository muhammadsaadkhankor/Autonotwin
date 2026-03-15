import { convertTextToSpeech } from "./elevenLabs.mjs";
import { getPhonemes } from "./rhubarbLipSync.mjs";
import { readJsonTranscript, audioFileToBase64 } from "../utils/files.mjs";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);
const MAX_RETRIES = 10;
const RETRY_DELAY = 100;

const ensureDirectory = async (dirPath) => {
  try { await fs.access(dirPath); } catch { await fs.mkdir(dirPath, { recursive: true }); }
};

const getAudioDuration = async (fileName) => {
  await fs.access(fileName);
  const { stdout } = await execAsync(
    `ffprobe -i "${fileName}" -show_entries format=duration -v quiet -of csv="p=0"`
  );
  const duration = parseFloat(stdout.trim());
  if (isNaN(duration)) throw new Error("Invalid duration from ffprobe");
  return duration;
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const lipSync = async ({ messages }) => {
  if (!Array.isArray(messages)) throw new TypeError("Expected messages to be an array");

  await ensureDirectory("audios");

  await Promise.all(
    messages.map(async (message, index) => {
      const fileName = path.join("audios", `message_${index}.mp3`);
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          await convertTextToSpeech({ text: message.text, fileName });
          await delay(RETRY_DELAY);
          break;
        } catch (error) {
          console.error(`Attempt ${attempt + 1} failed:`, error.message);
          if (error.response?.status === 429 && attempt < MAX_RETRIES - 1) {
            await delay(Math.pow(2, attempt) * RETRY_DELAY);
          } else {
            throw error;
          }
        }
      }
      console.log(`Message ${index} converted to speech`);
    })
  );

  await Promise.all(
    messages.map(async (message, index) => {
      const fileName = path.join("audios", `message_${index}.mp3`);
      await getPhonemes({ message: index });
      message.audio = await audioFileToBase64({ fileName });
      message.lipsync = await readJsonTranscript({ fileName: path.join("audios", `message_${index}.json`) });

      const audioDuration = await getAudioDuration(fileName);
      if (message.lipsync && Array.isArray(message.lipsync)) {
        const last = message.lipsync[message.lipsync.length - 1];
        if (last && last.end < audioDuration) {
          message.lipsync.push({ start: last.end, end: audioDuration, value: "X" });
        }
      }
    })
  );

  return messages;
};

export { lipSync };
