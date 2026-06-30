// Onboarding assessment
// ---------------------------------------------------------------------------
// A short, warm, NON-test conversation shown once right after sign-up. It asks
// the learner three friendly questions, scores the answers (see scoreAssessment)
// and saves a profile that personalises the rest of the app — most directly the
// pre-voice vocabulary preview during cooking. It never feels like a quiz: every
// option is a feeling or a self-description, not a right/wrong answer.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Loader2, Volume2 } from "lucide-react";
import languages from "../data/languages.json";
import { useSpeak } from "../lib/speech.js";
import { saveProfile, scoreAssessment } from "../lib/profile.js";

// A simple instruction the learner listens to in step 2 (the "how much did you
// understand?" check). Spoken aloud with the same warm voice as the rest of app.
const SAMPLE_INSTRUCTION = "Chop the onions and add them to the pan.";

export default function Assessment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { speak, speaking } = useSpeak();

  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState({
    home_language: null,
    cookScore: null,
    listenScore: null,
    confidenceScore: null,
  });

  const set = (patch) => setAnswers((a) => ({ ...a, ...patch }));

  const finish = (final) => {
    setBusy(true);
    saveProfile(scoreAssessment(final));
    navigate("/", { replace: true });
  };

  const steps = [
    // 1 — Home language
    {
      key: "language",
      title: t("assess.langTitle"),
      subtitle: t("assess.langSubtitle"),
      options: languages.map((l) => ({ label: l.label, value: l.label })),
      onPick: (value) => {
        set({ home_language: value });
        setStepIndex(1);
      },
    },
    // 2 — Listening check (with audio)
    {
      key: "listen",
      title: t("assess.listenTitle"),
      subtitle: t("assess.listenSubtitle"),
      audio: SAMPLE_INSTRUCTION,
      options: [
        { label: t("assess.listenLittle"), value: 1 },
        { label: t("assess.listenMost"), value: 3 },
        { label: t("assess.listenAll"), value: 5 },
      ],
      onPick: (value) => {
        set({ listenScore: value, cookScore: value });
        setStepIndex(2);
      },
    },
    // 3 — Speaking confidence
    {
      key: "confidence",
      title: t("assess.confTitle"),
      subtitle: t("assess.confSubtitle"),
      options: [
        { label: t("assess.confLow"), value: 1 },
        { label: t("assess.confMid"), value: 3 },
        { label: t("assess.confHigh"), value: 5 },
      ],
      onPick: (value) => {
        const final = { ...answers, confidenceScore: value };
        set({ confidenceScore: value });
        finish(final);
      },
    },
  ];

  const step = steps[stepIndex];

  return (
    <div className="auth-page">
      <div className="auth-content">
        <p className="assess-progress">
          {t("assess.stepOf", { step: stepIndex + 1, total: steps.length })}
        </p>
        <h1>{step.title}</h1>
        <p className="assess-subtitle">{step.subtitle}</p>

        {step.audio && (
          <button
            type="button"
            className="action-button soft assess-listen"
            onClick={() => speak(step.audio)}
            disabled={speaking}
          >
            <Volume2 size={18} aria-hidden="true" />
            {speaking ? t("assess.playing") : t("assess.playSample")}
          </button>
        )}

        <div className="assess-options">
          {step.options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              className="assess-option"
              onClick={() => step.onPick(opt.value)}
              disabled={busy}
            >
              <span>{opt.label}</span>
              {busy ? (
                <Loader2 size={18} className="spin" aria-hidden="true" />
              ) : (
                <ArrowRight size={18} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        <p className="assess-reassure">{t("assess.reassure")}</p>
      </div>
    </div>
  );
}
