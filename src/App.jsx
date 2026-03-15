import { Canvas } from "@react-three/fiber";
import { Loader } from "@react-three/drei";
import { Suspense, useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { Scene } from "./components/Scene";
import { ChatPanel } from "./components/ChatPanel";
import { useChat } from "./hooks/useChat";

const DEFAULT_AVATAR = "/models/Avatar/ProfAbed_suit.glb";

function App() {
  const { loading, listening } = useChat();
  const [avatarPath, setAvatarPath] = useState(DEFAULT_AVATAR);

  const handleAvatarChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPath(URL.createObjectURL(file));
      e.target.value = "";
    }
  }, []);

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0f] overflow-hidden">
      {/* 3D Avatar — center */}
      <div className="relative flex-1 min-w-0">
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

        <Canvas
          shadows
          camera={{ position: [0, 0, 0], fov: 45 }}
          className="w-full h-full"
        >
          <Suspense fallback={null}>
            <Scene avatarPath={avatarPath} key={avatarPath} />
          </Suspense>
        </Canvas>
        <Loader />

        {/* Status badge */}
        <div className="absolute top-5 left-5 z-10">
          <div className="flex items-center gap-3 bg-black/30 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-4 py-2.5">
            <div className={`w-2 h-2 rounded-full ${
              loading ? "bg-amber-400 animate-pulse" : listening ? "bg-red-400 animate-pulse" : "bg-emerald-400"
            } shadow-[0_0_8px_rgba(52,211,153,0.5)]`} />
            <div>
              <p className="text-white text-sm font-medium leading-tight">Prof. El Saddik</p>
              <p className="text-white/30 text-[11px]">
                {loading ? "Processing..." : listening ? "Listening..." : "Digital Twin • Online"}
              </p>
            </div>
          </div>
        </div>

        {/* Change Avatar button */}
        <div className="absolute bottom-6 left-5 z-20">
          <label className="flex items-center gap-2 bg-black/30 backdrop-blur-xl border border-white/[0.08] rounded-xl px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors text-white/60 hover:text-white text-sm">
            <Upload size={15} />
            Change Avatar
            <input
              type="file"
              accept=".glb"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Chat panel — right */}
      <ChatPanel />
    </div>
  );
}

export default App;
