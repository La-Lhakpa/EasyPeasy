import { useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ChefHat, Loader2, Mic, Plus, RotateCcw, Volume2 } from "lucide-react";
import recipes from "../data/easypeasy_recipes.json";
import userProgress from "../data/userProgress.json";
import { cook } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { useProfile } from "../lib/profile.jsx";
import { useSpeak } from "../lib/speech.js";
import { addPhrase, useProgress } from "../lib/progress.js";

// Accidental taps produce a near-empty blob (~1 KB of header) that chokes the
// voice worker and 502s. Anything below this is treated as "didn't catch that".
const MIN_AUDIO_BYTES = 4000;

// A single live chat turn: NaanSense messages get the avatar gutter; the
// learner's replies are right-aligned with no avatar.
function ChatMessage({ tone = "assistant", children }) {
  return (
    <div className={`chat-msg ${tone}`}>
      {tone === "assistant" && (
        <div className="chat-avatar" aria-hidden="true">
          <ChefHat size={18} />
        </div>
      )}
      <div className="chat-bubble">{children}</div>
    </div>
  );
}

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error || new Error("Could not read the recording."));
    reader.readAsDataURL(blob);
  });

export default function CookingConversation() {
  const { recipeId } = useParams();
  const recipe = recipes.find((item) => item.name && item.name.toLowerCase().replace(/\s+/g, "-") === recipeId) || recipes[0];
  const { user } = useAuth();
  const { profile } = useProfile();

  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const progress = useProgress();
  const { speak: speakPhrase, speaking: phraseSpeaking } = useSpeak();

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const wantRecordingRef = useRef(false);

  const steps = recipe.steps || [];
  const totalSteps = steps.length;
  const currentStep = steps[stepIndex];

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const speak = (text, audioBase64) => {
    stopAudio();
    if (audioBase64) {
      const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => {
        if (audioRef.current === audio) audioRef.current = null;
        setStatus("idle");
      };
      setStatus("speaking");
      audio.play().catch(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-IN";
        utterance.rate = 0.95;
        utterance.onend = () => setStatus("idle");
        window.speechSynthesis.speak(utterance);
      });
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      utterance.rate = 0.95;
      utterance.onend = () => setStatus("idle");
      setStatus("speaking");
      window.speechSynthesis.speak(utterance);
    }
  };

  const sendTurn = async (blob) => {
    setStatus("thinking");
    try {
      console.log(`[Cook] Audio blob: ${blob.size} bytes, type: ${blob.type || "unknown"}`);
      const audio = await blobToBase64(blob);
      console.log(`[Cook] Sending base64 audio: ${audio?.length || 0} chars, MIME: ${blob.type}`);

      if (!user?.id) {
        setError("You must be logged in to use NaanSense and save phrases.");
        setStatus("idle");
        return;
      }

      const data = await cook({
        audio,
        mimeType: blob.type,
        recipe: { name: recipe.name, steps: recipe.steps },
        stepIndex,
        messages: messages.slice(-8),
        nativeLanguage: profile?.native_language || userProgress.language,
        userId: user.id,
      });

      console.log("[Cook] API response data:", data);

      const next = [...messages];
      if (data.transcribed) next.push({ role: "user", content: data.transcribed });
      if (data.response) next.push({ role: "assistant", content: data.response });
      setMessages(next);

      speak(data.response, data.audioBase64);
    } catch (err) {
      setError(err?.message || "NaanSense had trouble. Please try again.");
      setStatus("idle");
    }
  };

  const startRecording = async () => {
    if (status === "recording" || status === "thinking") return;
    setError("");
    stopAudio();
    wantRecordingRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let options = { mimeType: "audio/webm" };
      const supported = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/wav",
        "audio/mp4",
      ];
      for (const type of supported) {
        if (MediaRecorder.isTypeSupported(type)) {
          options = { mimeType: type };
          break;
        }
      }

      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        if (blob.size >= MIN_AUDIO_BYTES) {
          sendTurn(blob);
        } else {
          setStatus("idle");
          setError("I didn't quite catch that — hold the button and speak a little longer.");
        }
      };

      recorder.start();
      setRecording(true);
      setStatus("recording");

      // The user may have released during the getUserMedia await; honor it now.
      if (!wantRecordingRef.current) stopRecording();
    } catch (err) {
      setError("I need the microphone to hear you. Please allow it and try again.");
      setStatus("error");
    }
  };

  const stopRecording = () => {
    wantRecordingRef.current = false;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
      setRecording(false);
    }
  };

  const reset = () => {
    stopAudio();
    setMessages([]);
    setStatus("idle");
    setError("");
  };

  const handlePress = (e) => {
    e.preventDefault();
    if (status !== "thinking") startRecording();
  };

  const handleRelease = () => {
    wantRecordingRef.current = false;
    if (recording) stopRecording();
  };

  let talkLabel = "Hold the mic and say it aloud";
  if (recording) talkLabel = "Listening… release when done";
  else if (status === "thinking") talkLabel = "Thinking…";
  else if (status === "speaking") talkLabel = "NaanSense is speaking…";

  const recipeSlug = recipe.name.toLowerCase().replace(/\s+/g, "-");
  const phraseSaved = Boolean(currentStep?.phrase && progress.phrases[currentStep.phrase.trim()]);

  return (
    <div className="page-stack cook-chat">
      {/* Top bar: a quiet link back to the recipe (language pill floats right,
          rendered globally by AppShell), then the step context + title. */}
      <Link className="cook-recipe-link" to={`/cooking/${recipeSlug}`}>
        <ArrowLeft size={16} aria-hidden="true" /> Recipe
      </Link>
      <div>
        <p className="eyebrow">Step {stepIndex + 1} of {totalSteps}</p>
        <h1 className="cook-chat-title">{recipe.name}</h1>
      </div>

      {/* Progress bar across the recipe's steps */}
      <div className="step-meter" aria-label={`Step ${stepIndex + 1} of ${totalSteps}`}>
        {steps.map((_, i) => (
          <span key={i} className={i <= stepIndex ? "filled" : ""} />
        ))}
      </div>

      {/* Chat thread */}
      <section className="cook-thread">
        {/* NaanSense's grouped opening: one avatar, then the intro, the step
            instruction, and the suggested phrase, aligned under it. */}
        <div className="chat-group">
          <span className="chat-speaker">NaanSense</span>

          <div className="chat-lead">
            <div className="chat-avatar" aria-hidden="true">
              <ChefHat size={18} />
            </div>
            <div className="chat-bubble">
              When you're ready, hold the mic and say hello. We'll cook {recipe.name} together — there's no rush, and no test. Just us talking.
            </div>
          </div>

          {currentStep && (
            <div className="chat-bubble plain chat-indent">{currentStep.instruction}</div>
          )}

          {currentStep?.phrase && (
            <div className="phrase-group chat-indent">
              <div className="chat-bubble phrase-bubble">
                <em>"{currentStep.phrase}"</em>
                <button
                  type="button"
                  className="phrase-save-btn"
                  onClick={() => addPhrase(currentStep.phrase, { recipeName: recipe.name })}
                  disabled={phraseSaved}
                >
                  {phraseSaved ? <Check size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
                  {phraseSaved ? "Saved" : "Save"}
                </button>
              </div>
              <button
                type="button"
                className="chat-hear"
                onClick={() => speakPhrase(currentStep.phrase)}
              >
                <Volume2 size={16} aria-hidden="true" />
                {phraseSpeaking ? "Playing…" : "Hear this phrase"}
              </button>
            </div>
          )}
        </div>

        {/* Live back-and-forth */}
        {messages.map((message, idx) => (
          <ChatMessage key={idx} tone={message.role === "assistant" ? "assistant" : "user"}>
            {message.content}
          </ChatMessage>
        ))}

        {status === "thinking" && (
          <ChatMessage tone="assistant">
            <span className="chat-typing"><Loader2 size={16} className="spin" aria-hidden="true" /> Thinking…</span>
          </ChatMessage>
        )}
        {status === "speaking" && (
          <ChatMessage tone="assistant">
            <span className="chat-typing"><Volume2 size={16} aria-hidden="true" /> NaanSense is speaking…</span>
          </ChatMessage>
        )}
      </section>

      {error && <p className="form-error">{error}</p>}

      {/* Voice input dock — the single primary action */}
      <div className={`voice-dock ${recording ? "recording" : ""}`}>
        <div className="voice-dock-left">
          <div className="voice-wave" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ animationDelay: `${i * 90}ms` }} />
            ))}
          </div>
          <span className="voice-label">{talkLabel}</span>
        </div>
        <button
          type="button"
          className={`voice-mic ${recording ? "recording" : ""}`}
          onPointerDown={handlePress}
          onPointerUp={handleRelease}
          onPointerCancel={handleRelease}
          disabled={status === "thinking"}
          aria-label="Hold to talk with NaanSense"
        >
          {status === "thinking" ? (
            <Loader2 size={24} className="spin" aria-hidden="true" />
          ) : (
            <Mic size={24} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Quiet step navigation */}
      <div className="cook-nav-row">
        <button
          type="button"
          className="cook-nav-text"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </button>
        <button
          type="button"
          className="cook-nav-text"
          onClick={() => setStepIndex((i) => Math.min(totalSteps - 1, i + 1))}
          disabled={stepIndex >= totalSteps - 1}
        >
          Next step <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>

      {messages.length > 0 && (
        <button type="button" className="cook-startover" onClick={reset}>
          <RotateCcw size={15} aria-hidden="true" /> Start over
        </button>
      )}
    </div>
  );
}
