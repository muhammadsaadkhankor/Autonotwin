import { useRef, useState, useEffect } from "react";
import { Send, Mic, MicOff, MessageSquare, Bot, User, AlertCircle } from "lucide-react";
import { useChat } from "../hooks/useChat";

export function ChatPanel() {
  const inputRef = useRef();
  const scrollRef = useRef();
  const {
    messages, loading, listening, speechSupported,
    sendMessage, startListening, stopListening,
  } = useChat();
  const [micHeld, setMicHeld] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    const text = inputRef.current?.value?.trim();
    if (text) {
      sendMessage(text);
      inputRef.current.value = "";
    }
  };

  const handleMicDown = async () => {
    if (!speechSupported || loading) return;
    setMicHeld(true);
    const transcript = await startListening();
    setMicHeld(false);
    if (transcript?.trim() && inputRef.current) {
      inputRef.current.value = transcript;
      inputRef.current.focus();
    }
  };

  const handleMicUp = () => {
    if (micHeld) {
      stopListening();
      setMicHeld(false);
    }
  };

  const PROF_IMG = "/Images/prof_twin.png";

  const roleIcon = (role) => {
    if (role === "user") return <User size={14} />;
    if (role === "error") return <AlertCircle size={14} />;
    return <img src={PROF_IMG} alt="Prof" className="w-full h-full rounded-lg object-cover" />;
  };

  return (
    <div className="w-[450px] h-full flex flex-col bg-white/[0.06] backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/30">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.08] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-400/15 flex items-center justify-center">
          <MessageSquare size={16} className="text-indigo-300" />
        </div>
        <div className="flex-1">
          <h2 className="text-white/90 text-sm font-semibold">Chat</h2>
          <p className="text-white/40 text-xs">
            {loading ? "Thinking..." : listening ? "Listening..." : "Ask anything"}
          </p>
        </div>
        {loading && (
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dot-1" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dot-2" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dot-3" />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-40">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center">
              <MessageSquare size={28} className="text-white/25" />
            </div>
            <div>
              <p className="text-white/60 text-sm font-medium">Start a conversation</p>
              <p className="text-white/30 text-xs mt-1">Type a message or hold the mic</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex msg-enter ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden ${
                  msg.role === "user" ? "bg-white/60 text-black"
                    : msg.role === "error" ? "bg-red-500/20 text-red-300"
                    : ""
                }`}>
                  {roleIcon(msg.role)}
                </div>
                <div className={`px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl ${
                  msg.role === "user"
                    ? "bg-white/80 text-black border border-white/30 rounded-br-md"
                    : msg.role === "error"
                    ? "bg-red-500/10 text-red-300 border border-red-500/20 rounded-bl-md"
                    : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-bl-md"
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start msg-enter">
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0 mt-0.5">
                <img src={PROF_IMG} alt="Prof" className="w-full h-full object-cover" />
              </div>
              <div className="px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-white/20 dot-1" />
                  <span className="w-2 h-2 rounded-full bg-white/20 dot-2" />
                  <span className="w-2 h-2 rounded-full bg-white/20 dot-3" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/[0.08]">
        <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-2xl px-2 py-1.5 focus-within:border-indigo-400/40 transition-colors">
          {speechSupported && (
            <button
              onMouseDown={handleMicDown}
              onMouseUp={handleMicUp}
              onMouseLeave={handleMicUp}
              onTouchStart={(e) => { e.preventDefault(); handleMicDown(); }}
              onTouchEnd={(e) => { e.preventDefault(); handleMicUp(); }}
              disabled={loading}
              className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                micHeld || listening
                  ? "bg-indigo-500 pulse-active text-white"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              } ${loading ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {micHeld || listening ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
          )}
          <input
            ref={inputRef}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none px-2 py-2"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className={`p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors flex-shrink-0 text-white ${
              loading ? "opacity-20 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
