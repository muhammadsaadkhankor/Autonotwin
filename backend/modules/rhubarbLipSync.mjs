import { execCommand } from "../utils/files.mjs";

const getPhonemes = async ({ message }) => {
  try {
    const time = new Date().getTime();
    console.log(`Starting conversion for message ${message}`);
    await execCommand({
      command: `ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`,
    });
    console.log(`Conversion done in ${new Date().getTime() - time}ms`);
    await execCommand({
      command: `./bin/rhubarb -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`,
    });
    console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
  } catch (error) {
    console.error(`Error getting phonemes for message ${message}:`, error);
  }
};

export { getPhonemes };
