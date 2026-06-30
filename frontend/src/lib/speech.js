// useSpeak — a small hook that powers every "Hear It" button.
// It asks the backend for a warm Indian-accent voice (Sarvam/Google) and plays
// the returned audio. If that's unavailable for any reason, it transparently
// falls back to the browser's built-in speech synthesis so the learner always
// hears something. Exposes { speak, stop, speaking, activeText }.

import { useCallback, useEffect, useRef, useState } from "react";
import { tts } from "./api.js";

export function useSpeak() {
  const [speaking, setSpeaking] = useState(false);
  const [activeText, setActiveText] = useState("");
  const audioRef = useRef(null);
  const tokenRef = useRef(0);

  const stop = useCallback(() => {
    tokenRef.current += 1; // invalidate any in-flight request
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setActiveText("");
  }, []);

  const browserSpeak = useCallback((text, token) => {
    if (!("speechSynthesis" in window)) {
      setSpeaking(false);
      setActiveText("");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.85; // a touch slower for beginners
    utterance.onend = () => {
      if (tokenRef.current === token) {
        setSpeaking(false);
        setActiveText("");
      }
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(
    async (text) => {
      const clean = (text || "").trim();
      if (!clean) return;

      // Toggle off if the same phrase is already playing.
      if (speaking && activeText === clean) {
        stop();
        return;
      }

      stop();
      const token = (tokenRef.current += 1);
      setSpeaking(true);
      setActiveText(clean);

      try {
        const { audioBase64 } = await tts(clean);
        if (tokenRef.current !== token) return; // superseded by a newer call
        if (audioBase64) {
          const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => {
            if (tokenRef.current === token) {
              setSpeaking(false);
              setActiveText("");
            }
          };
          await audio.play();
          return;
        }
        browserSpeak(clean, token);
      } catch {
        if (tokenRef.current === token) browserSpeak(clean, token);
      }
    },
    [speaking, activeText, stop, browserSpeak]
  );

  // Clean up if the component using the hook unmounts mid-playback.
  useEffect(() => stop, [stop]);

  return { speak, stop, speaking, activeText };
}
