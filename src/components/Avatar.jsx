import { useRef, useEffect, useState, useMemo } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useChat } from "../hooks/useChat";
import facialExpressions from "../constants/facialExpressions";
import visemesMapping from "../constants/visemesMapping";
import morphTargets from "../constants/morphTargets";

const DEFAULT_AVATAR = "/models/Avatar/ProfAbed_suit.glb";

const ANIMATION_FILES = {
  Idle: "/models/Animations/idle.glb",
  Talking: "/models/Animations/Talking.glb",
  Angry: "/models/Animations/Angry.glb",
  Sad: "/models/Animations/Sad.glb",
  Surprised: "/models/Animations/Surprised.glb",
  Disappointed: "/models/Animations/Disappointed.glb",
  ThoughtfulHeadShake: "/models/Animations/Thoughtfullheadshake.glb",
};

const ANIMATION_MAP = {
  Idle: "Idle",
  TalkingOne: "Talking",
  TalkingTwo: "Talking",
  TalkingThree: "Talking",
  Angry: "Angry",
  Sad: "Sad",
  SadIdle: "Sad",
  Surprised: "Surprised",
  Defeated: "Disappointed",
  Disappointed: "Disappointed",
  DismissingGesture: "ThoughtfulHeadShake",
  ThoughtfulHeadShake: "ThoughtfulHeadShake",
};

function resolveAnimation(name) {
  return ANIMATION_MAP[name] || "Idle";
}

export function Avatar({ modelPath = DEFAULT_AVATAR, ...props }) {
  const group = useRef();
  const { nodes, materials } = useGLTF(modelPath);
  const { currentMessage, onMessagePlayed } = useChat();

  const idleGlb = useGLTF(ANIMATION_FILES.Idle);
  const talkingGlb = useGLTF(ANIMATION_FILES.Talking);
  const angryGlb = useGLTF(ANIMATION_FILES.Angry);
  const sadGlb = useGLTF(ANIMATION_FILES.Sad);
  const surprisedGlb = useGLTF(ANIMATION_FILES.Surprised);
  const disappointedGlb = useGLTF(ANIMATION_FILES.Disappointed);
  const headshakeGlb = useGLTF(ANIMATION_FILES.ThoughtfulHeadShake);

  const allAnimations = useMemo(() => {
    const clips = [];
    const addClips = (glb, name) => {
      glb.animations.forEach((clip) => {
        const renamed = clip.clone();
        renamed.name = name;
        clips.push(renamed);
      });
    };
    addClips(idleGlb, "Idle");
    addClips(talkingGlb, "Talking");
    addClips(angryGlb, "Angry");
    addClips(sadGlb, "Sad");
    addClips(surprisedGlb, "Surprised");
    addClips(disappointedGlb, "Disappointed");
    addClips(headshakeGlb, "ThoughtfulHeadShake");
    return clips;
  }, [idleGlb, talkingGlb, angryGlb, sadGlb, surprisedGlb, disappointedGlb, headshakeGlb]);

  const { actions, mixer } = useAnimations(allAnimations, group);

  const [animation, setAnimation] = useState("Idle");
  const [facialExpression, setFacialExpression] = useState("");
  const [lipsync, setLipsync] = useState(null);
  const [audio, setAudio] = useState(null);
  const [blink, setBlink] = useState(false);

  const lerpMorphTarget = (target, value, speed = 0.1) => {
    group.current?.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const idx = child.morphTargetDictionary[target];
        if (idx !== undefined && child.morphTargetInfluences[idx] !== undefined) {
          child.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
            child.morphTargetInfluences[idx], value, speed
          );
        }
      }
    });
  };

  useEffect(() => {
    if (!currentMessage) {
      setAnimation("Idle");
      setAudio(null);
      setLipsync(null);
      return;
    }
    setAnimation(resolveAnimation(currentMessage.animation));
    setFacialExpression(currentMessage.facialExpression || "");
    setLipsync(currentMessage.lipsync || null);

    if (currentMessage.audio) {
      const a = new Audio("data:audio/mp3;base64," + currentMessage.audio);
      a.play();
      a.onended = onMessagePlayed;
      setAudio(a);
    } else {
      const t = setTimeout(onMessagePlayed, 2000);
      return () => clearTimeout(t);
    }
  }, [currentMessage]);

  useEffect(() => {
    const action = actions[animation];
    if (action) {
      action.reset().fadeIn(mixer.stats.actions.inUse === 0 ? 0 : 0.5).play();
      return () => action.fadeOut(0.5);
    }
  }, [animation, actions, mixer]);

  useEffect(() => {
    let timeout;
    const nextBlink = () => {
      timeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); nextBlink(); }, 200);
      }, THREE.MathUtils.randInt(1000, 5000));
    };
    nextBlink();
    return () => clearTimeout(timeout);
  }, []);

  useFrame(() => {
    morphTargets.forEach((key) => {
      if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") return;
      const mapping = facialExpressions[facialExpression];
      lerpMorphTarget(key, mapping?.[key] || 0, 0.1);
    });

    lerpMorphTarget("eyeBlinkLeft", blink ? 1 : 0, 0.5);
    lerpMorphTarget("eyeBlinkRight", blink ? 1 : 0, 0.5);

    const applied = [];
    if (currentMessage && lipsync && audio) {
      const t = audio.currentTime;
      for (const cue of lipsync.mouthCues || []) {
        if (t >= cue.start && t <= cue.end) {
          const v = visemesMapping[cue.value];
          if (v) { applied.push(v); lerpMorphTarget(v, 1, 0.2); }
          break;
        }
      }
    }
    Object.values(visemesMapping).forEach((v) => {
      if (!applied.includes(v)) lerpMorphTarget(v, 0, 0.1);
    });
  });

  return (
    <group ref={group} {...props} dispose={null}>
      {nodes?.Hips && <primitive object={nodes.Hips} />}
      {Object.values(nodes || {}).map((node) =>
        node.isSkinnedMesh || node.isMesh ? (
          <skinnedMesh
            key={node.uuid}
            geometry={node.geometry}
            material={materials[node.material.name]}
            skeleton={node.skeleton}
            morphTargetDictionary={node.morphTargetDictionary}
            morphTargetInfluences={node.morphTargetInfluences}
          />
        ) : null
      )}
    </group>
  );
}

useGLTF.preload(DEFAULT_AVATAR);
Object.values(ANIMATION_FILES).forEach((p) => useGLTF.preload(p));
