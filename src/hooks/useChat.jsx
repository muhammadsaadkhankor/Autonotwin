import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

const BACKEND_URL = "http://localhost:3000";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [avatarMessages, setAvatarMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptPromiseRef = useRef(null);

  // Init speech recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.continuous = false;
      r.interimResults = false;
      r.lang = "en-US";
      recognitionRef.current = r;
      setSpeechSupported(true);
    }
  }, []);

  // Play avatar messages sequentially
  useEffect(() => {
    setCurrentMessage(avatarMessages.length > 0 ? avatarMessages[0] : null);
  }, [avatarMessages]);

  const onMessagePlayed = useCallback(() => {
    setAvatarMessages((prev) => prev.slice(1));
  }, []);

  // Send text message to backend /tts
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loadingRef.current) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    loadingRef.current = true;
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (data.messages?.length) {
        setAvatarMessages((prev) => [...prev, ...data.messages]);
        const aiText = data.messages.map((m) => m.text).join(" ");
        setMessages((prev) => [...prev, { role: "assistant", text: aiText }]);
      }
    } catch (err) {
      console.error("Backend error:", err);
      setMessages((prev) => [...prev, { role: "error", text: "Could not reach the backend server." }]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Send audio to backend /sts with transcribed text
  const sendAudio = useCallback(async (transcribedText) => {
    if (!transcribedText?.trim() || loadingRef.current) return;
    await sendMessage(transcribedText);
  }, [sendMessage]);

  // Start speech recognition — returns a promise that resolves with transcript
  const startListening = useCallback(() => {
    if (!recognitionRef.current || listening) return Promise.resolve("");

    if (transcriptPromiseRef.current) return transcriptPromiseRef.current;

    transcriptPromiseRef.current = new Promise((resolve) => {
      const r = recognitionRef.current;
      r.onstart = () => setListening(true);
      r.onresult = (e) => {
        const t = e.results[0][0].transcript;
        setListening(false);
        transcriptPromiseRef.current = null;
        resolve(t);
      };
      r.onerror = () => {
        setListening(false);
        transcriptPromiseRef.current = null;
        resolve("");
      };
      r.onend = () => {
        setListening(false);
        if (transcriptPromiseRef.current) {
          transcriptPromiseRef.current = null;
          resolve("");
        }
      };
      try { r.start(); } catch { resolve(""); }
    });

    return transcriptPromiseRef.current;
  }, [listening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && listening) {
      try { recognitionRef.current.stop(); } catch {}
      setListening(false);
    }
  }, [listening]);

  return (
    <ChatContext.Provider
      value={{
        messages, loading, listening, speechSupported,
        currentMessage, onMessagePlayed,
        sendMessage, sendAudio, startListening, stopListening,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};
