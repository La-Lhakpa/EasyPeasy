import { useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2, Mic, Plus, RotateCcw, Volume2 } from "lucide-react";
import ConversationBubble from "../components/ConversationBubble.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SavePhraseButton from "../components/SavePhraseButton.jsx";
import recipes from "../data/easypeasy_recipes.json";
import userProgress from "../data/userProgress.json";
import { cook } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { useProfile } from "../lib/profile.jsx";
import { addPhrase, useProgress } from "../lib/progress.js";

// Accidental taps produce a near-empty blob (~1 KB of header) that chokes the
// voice worker and 502s. Anything below this is treated as "didn\'t catch that".
const MIN_AUDIO_BYTES = 4000;

const blobToBase64 = (
  blob) =>
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
          setError("I didn\'t quite catch that — hold the button and speak a little longer.");
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

  let talkLabel = "Hold to talk";
  if (recording) talkLabel = "Listening… release when done";
  else if (status === "thinking") talkLabel = "Thinking…";
  else if (status === "speaking") talkLabel = "NaanSense is speaking…";

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={` Step ${stepIndex + 1} of ${totalSteps}`}
        title={recipe.name}
      />

      <section className="conversation-panel">
        {messages.length === 0 ? (
          <div className="conversation-row assistant">
            <div className="speaker">NaanSense</div>
            <div className="bubble">
              When you\'re ready, hold the button and say hello. We\'ll cook {recipe.name} together — there\'s no rush, and no test. Just us talking.
            </div>
          </div>
        ) : (
          messages.map((message, idx) => (
            <ConversationBubble
              key={idx}
              speaker={message.role === "assistant" ? "NaanSense" : "You"}
              tone={message.role === "assistant" ? "assistant" : "user"}
            >
              {message.content}
            </ConversationBubble>
          ))
        )}

        {status === "thinking" && (
          <div className="conversation-row assistant">
            <div className="speaker">NaanSense</div>
            <div className="bubble typing">
              <Loader2 size={16} className="spin" aria-hidden="true" /> Thinking…
            </div>
          </div>
        )}

        {status === "speaking" && (
          <div className="conversation-row assistant">
            <div className="speaker">NaanSense</div>
            <div className="bubble typing">
              <Volume2 size={16} aria-hidden="true" /> NaanSense is speaking…
            </div>
          </div>
        )}
      </section>

      {currentStep && (
        <section className="conversation-panel">
          <div className="speaker">Step {stepIndex + 1} of {totalSteps}</div>
          <p className="bubble">{currentStep.instruction}</p>
          {currentStep.phrase && (
            <p className="form-hint">
              Try saying: "{currentStep.phrase}"
              <button
                type="button"
                className="save-phrase-button"
                onClick={() => addPhrase(currentStep.phrase, { recipeName: recipe.name })}
                disabled={Boolean(progress.phrases[currentStep.phrase?.trim()])}
              >
                {progress.phrases[currentStep.phrase?.trim()] ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <Plus size={16} aria-hidden="true" />
                )}
                {progress.phrases[currentStep.phrase?.trim()] ? "Saved" : "Save Phrase"}
              </button>
            </p>
          )}
          <div className="chat-input">
            <button
              type="button"
              className="action-button ghost"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
              aria-label="Previous step"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Back
            </button>
            <button
              type="button"
              className="action-button ghost"
              onClick={() => setStepIndex((i) => Math.min(totalSteps - 1, i + 1))}
              disabled={stepIndex >= totalSteps - 1}
              aria-label="Next step"
            >
              Next
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="chat-input">
        <button
          type="button"
          className={`action-button full ${recording ? "danger" : "primary"}`}
          onPointerDown={handlePress}
          onPointerUp={handleRelease}
          onPointerCancel={handleRelease}
          disabled={status === "thinking"}
          aria-label="Hold to talk with NaanSense"
        >
          {status === "thinking" ? (
            <Loader2 size={18} className="spin" aria-hidden="true" />
          ) : (
            <Mic size={18} aria-hidden="true" />
          )}
          {talkLabel}
        </button>
      </div>
      {messages.length > 0 && (
        <button type="button" className="action-button ghost full" onClick={reset}>
          <RotateCcw size={18} aria-hidden="true" />
          Start over
        </button>
      )}

      <Link className="primary-link full" to={`/cooking/${recipe.name.toLowerCase().replace(/\s+/g, "-")}`}>
        Back to Recipe <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}
