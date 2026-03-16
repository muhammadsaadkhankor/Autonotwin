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
    <div className="relative h-screen w-screen overflow-hidden">
      {/* 3D Canvas — full screen */}
      <Canvas
        shadows
        camera={{ position: [0, 0, 0], fov: 45 }}
        className="!absolute inset-0"
      >
        <Suspense fallback={null}>
          <Scene avatarPath={avatarPath} key={avatarPath} />
        </Suspense>
      </Canvas>
      <Loader />

      {/* Status badge */}
      <div className="absolute top-5 right-5 z-10">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-2.5">
          <img src="/Images/prof_twin.png" alt="Prof" className="w-8 h-8 rounded-full object-cover" />
          <div className={`w-2 h-2 rounded-full ${
            loading ? "bg-amber-400 animate-pulse" : listening ? "bg-red-400 animate-pulse" : "bg-emerald-400"
          } shadow-[0_0_8px_rgba(52,211,153,0.5)]`} />
          <div>
            <p className="text-white text-sm font-medium leading-tight">Prof. El Saddik</p>
            <p className="text-white/40 text-[11px]">
              {loading ? "Processing..." : listening ? "Listening..." : "Digital Twin • Online"}
            </p>
          </div>
        </div>
      </div>

      {/* Change Avatar button */}
      <div className="absolute bottom-6 right-5 z-20">
        <label className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/15 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-white/20 transition-colors text-white/70 hover:text-white text-sm">
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

      {/* Chat panel — overlaid on left */}
      <div className="absolute top-4 left-4 bottom-4 z-20">
        <ChatPanel />
      </div>
    </div>
  );
}

export default App;
