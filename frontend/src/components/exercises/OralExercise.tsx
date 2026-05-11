"use client";

import { useState, useRef, useCallback } from "react";

export interface OralWord {
  arabic: string;
  translation: string;
  syllables: string;
  audio_url?: string;
}

export interface OralExerciseProps {
  words: OralWord[];
  onComplete: (results: WordResult[]) => void;
  apiBaseUrl?: string;
}

interface WordResult {
  word: OralWord;
  passed: boolean;
  attempts: number;
  best_score: number;
}

type Phase = "idle" | "recording" | "evaluating" | "success" | "close" | "error" | "failed";

interface EvalResult {
  score: number;
  transcription: string;
  feedback: string;
  error_detail: string | null;
}

const MAX_ATTEMPTS = 2;
const RECORD_TIMEOUT_MS = 6000;
const SCORE_SUCCESS = 85;
const SCORE_CLOSE = 60;

const s = {
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: "2rem",
    maxWidth: 520,
    margin: "0 auto",
    fontFamily: "system-ui, sans-serif",
  } as React.CSSProperties,

  progressBar: {
    height: 3,
    background: "#e5e7eb",
    borderRadius: 2,
    marginBottom: "2rem",
    overflow: "hidden",
  } as React.CSSProperties,

  progressFill: (pct: number): React.CSSProperties => ({
    height: "100%",
    width: `${pct}%`,
    background: "#1D9E75",
    borderRadius: 2,
    transition: "width 0.4s ease",
  }),

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    fontSize: 13,
    color: "#6b7280",
  } as React.CSSProperties,

  wordDisplay: (phase: Phase): React.CSSProperties => {
    const borders: Record<string, string> = {
      success: "#1D9E75", close: "#EF9F27", error: "#E24B4A",
      failed: "#E24B4A", recording: "#378ADD",
    };
    const bgs: Record<string, string> = {
      success: "#E1F5EE", close: "#FAEEDA", error: "#FCEBEB",
      failed: "#FCEBEB", recording: "#E6F1FB",
    };
    return {
      textAlign: "center",
      padding: "2rem 1rem",
      borderRadius: 12,
      background: bgs[phase] ?? "#f9fafb",
      marginBottom: "1.5rem",
      minHeight: 120,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.75rem",
      transition: "background 0.3s ease, border 0.3s ease",
      border: `1.5px solid ${borders[phase] ?? "transparent"}`,
    };
  },

  arabicText: {
    fontFamily: "'Amiri', 'Scheherazade New', serif",
    fontSize: "2.8rem",
    direction: "rtl",
    lineHeight: 1.3,
    color: "#111",
  } as React.CSSProperties,

  translation: {
    fontSize: 14,
    color: "#6b7280",
  } as React.CSSProperties,

  dots: {
    display: "flex",
    gap: 6,
    justifyContent: "center",
    marginBottom: "1.5rem",
  } as React.CSSProperties,

  dot: (state: "unused" | "used" | "current"): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: state === "used" ? "#E24B4A" : state === "current" ? "#378ADD" : "#e5e7eb",
    transition: "background 0.2s",
  }),

  attemptLabel: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: "1rem",
  } as React.CSSProperties,

  btnRow: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  btnListen: (disabled: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "transparent",
    color: "#374151",
    fontSize: 14,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
  }),

  btnRecord: (phase: Phase, disabled: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 28px",
    borderRadius: 8,
    border: `1px solid ${phase === "recording" ? "#A32D2D" : "#185FA5"}`,
    background: phase === "recording" ? "#E24B4A" : "#378ADD",
    color: "#fff",
    fontSize: 15,
    fontWeight: 500,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
  }),

  feedback: (type: "success" | "close" | "error" | "fail"): React.CSSProperties => {
    const map = {
      success: { bg: "#E1F5EE", color: "#0F6E56", border: "#5DCAA5" },
      close:   { bg: "#FAEEDA", color: "#854F0B", border: "#EF9F27" },
      error:   { bg: "#FCEBEB", color: "#A32D2D", border: "#F09595" },
      fail:    { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
    };
    return {
      marginTop: "1.5rem",
      padding: "1rem 1.25rem",
      borderRadius: 8,
      fontSize: 14,
      lineHeight: 1.6,
      background: map[type].bg,
      color: map[type].color,
      border: `1px solid ${map[type].border}`,
    };
  },

  transcriptionPreview: {
    marginTop: "0.75rem",
    fontFamily: "'Amiri', serif",
    fontSize: "1.2rem",
    direction: "rtl" as const,
    textAlign: "center" as const,
    opacity: 0.7,
  } as React.CSSProperties,

  btnNext: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 24px",
    borderRadius: 8,
    border: "1px solid #1D9E75",
    background: "#E1F5EE",
    color: "#0F6E56",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    marginTop: "1rem",
  } as React.CSSProperties,
};

export default function OralExercise({ words, onComplete, apiBaseUrl }: OralExerciseProps) {
  const baseUrl = apiBaseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const [currentIdx, setCurrentIdx] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [results, setResults] = useState<WordResult[]>([]);
  const [bestScore, setBestScore] = useState(0);

  // Refs pour éviter les problèmes de closure
  const attemptRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordRef = useRef(words[currentIdx]);
  wordRef.current = words[currentIdx];

  const word = words[currentIdx];
  const progress = (currentIdx / words.length) * 100;

  const handleListen = useCallback(() => {
    if (wordRef.current.audio_url) {
      new Audio(wordRef.current.audio_url).play().catch(console.warn);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setPhase("evaluating");
  }, []);

  const handleResult = useCallback((result: EvalResult) => {
    setEvalResult(result);
    setBestScore((prev) => Math.max(prev, result.score));

    const currentAttempt = attemptRef.current;
    const newAttempt = currentAttempt + 1;

    console.log("handleResult:", result.score, "attempt:", currentAttempt, "newAttempt:", newAttempt, "MAX:", MAX_ATTEMPTS);

    if (result.score >= SCORE_SUCCESS) {
      setPhase("success");
      setScore((prev) => prev + 10);
    } else if (newAttempt >= MAX_ATTEMPTS) {
      setPhase("failed");
      attemptRef.current = newAttempt;
      setAttempt(newAttempt);
    } else if (result.score >= SCORE_CLOSE) {
      setPhase("close");
      attemptRef.current = newAttempt;
      setAttempt(newAttempt);
    } else {
      setPhase("error");
      attemptRef.current = newAttempt;
      setAttempt(newAttempt);
    }
  }, []);

  const evaluateRecording = useCallback(async () => {
    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("expected_arabic", wordRef.current.arabic);
    formData.append("translation", wordRef.current.translation);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${baseUrl}/api/v1/oral/evaluate`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: EvalResult = await res.json();
      handleResult(data);
    } catch (e) {
      console.error("Évaluation échouée:", e);
      handleResult({
        score: 0,
        transcription: "",
        feedback: "Erreur de connexion au serveur d'évaluation.",
        error_detail: null,
      });
    }
  }, [baseUrl, handleResult]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedMime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const recorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : {});
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        evaluateRecording();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setPhase("recording");
      setEvalResult(null);
      timeoutRef.current = setTimeout(() => stopRecording(), RECORD_TIMEOUT_MS);
    } catch {
      setPhase("error");
      setEvalResult({
        score: 0,
        transcription: "",
        feedback: "Microphone inaccessible. Autorise l'accès dans ton navigateur.",
        error_detail: null,
      });
    }
  }, [evaluateRecording, stopRecording]);

  const handleRecord = useCallback(() => {
    if (phase === "recording") {
      stopRecording();
    } else if (phase !== "evaluating") {
      startRecording();
    }
  }, [phase, startRecording, stopRecording]);

  const handleNext = useCallback(() => {
    const passed = phase === "success";
    const newResults = [
      ...results,
      {
        word: wordRef.current,
        passed,
        attempts: attemptRef.current,
        best_score: bestScore,
      },
    ];

    if (currentIdx + 1 >= words.length) {
      onComplete(newResults);
      return;
    }

    setResults(newResults);
    setCurrentIdx((i) => i + 1);
    setAttempt(0);
    attemptRef.current = 0;
    setPhase("idle");
    setEvalResult(null);
    setBestScore(0);
  }, [phase, results, bestScore, currentIdx, words.length, onComplete]);

  const showNext = phase === "success" || phase === "failed";
  const recordDisabled =
    phase === "evaluating" ||
    phase === "success" ||
    phase === "failed" ||
    attemptRef.current >= MAX_ATTEMPTS;

  const feedbackType =
    phase === "success" ? "success" :
    phase === "close"   ? "close"   :
    phase === "failed"  ? "fail"    : "error";

  const recordLabel =
    phase === "recording"  ? "Arrêter" :
    phase === "evaluating" ? "Évaluation..." :
    attempt > 0            ? "Réessayer" : "Prononcer";

  return (
    <div style={s.card}>
      <div style={s.progressBar}>
        <div style={s.progressFill(progress)} />
      </div>

      <div style={s.topRow}>
        <span>Mot {currentIdx + 1} / {words.length}</span>
        <span>Score : {score} pts</span>
      </div>

      <div style={s.wordDisplay(phase)}>
        <div style={s.arabicText}>{word.arabic}</div>
        <div style={s.translation}>{word.translation}</div>
      </div>

      <div style={s.dots}>
        {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
          <div
            key={i}
            style={s.dot(i < attempt ? "used" : i === attempt && phase !== "failed" && phase !== "success" ? "current" : "unused")}
          />
        ))}
      </div>

      <div style={s.attemptLabel}>
        {attempt < MAX_ATTEMPTS && phase !== "failed"
          ? `Essai ${attempt + 1} sur ${MAX_ATTEMPTS}`
          : "Essais épuisés"}
      </div>

      <div style={s.btnRow}>
        <button
          style={s.btnListen(phase === "recording" || phase === "evaluating")}
          onClick={handleListen}
          disabled={phase === "recording" || phase === "evaluating"}
        >
          ◁ Écouter
        </button>

        <button
          style={s.btnRecord(phase, recordDisabled)}
          onClick={handleRecord}
          disabled={recordDisabled}
        >
          {phase === "recording" ? "■" : "●"} {recordLabel}
        </button>
      </div>

      {evalResult && (
        <div style={s.feedback(feedbackType)}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            {phase === "success" && `Bravo ! ${evalResult.score}/100`}
            {phase === "close"   && `Presque ! ${evalResult.score}/100 — réessaie`}
            {phase === "error"   && `À retravailler — ${evalResult.score}/100`}
            {phase === "failed"  && "Ce mot sera revu plus tard"}
          </div>
          <div>{evalResult.feedback}</div>
          {evalResult.error_detail && (
            <div style={{ marginTop: 4, fontSize: 13 }}>
              Difficulté sur : <strong>{evalResult.error_detail}</strong>
            </div>
          )}
          {phase === "failed" && (
            <div style={{ marginTop: 6, fontSize: 13 }}>
              Décomposition syllabique : <strong>{word.syllables}</strong>
            </div>
          )}
          {evalResult.transcription && (
            <div style={s.transcriptionPreview}>« {evalResult.transcription} »</div>
          )}
        </div>
      )}

      {showNext && (
        <div style={{ textAlign: "center" }}>
          <button style={s.btnNext} onClick={handleNext}>
            {currentIdx + 1 >= words.length ? "Terminer l'exercice →" : "Mot suivant →"}
          </button>
        </div>
      )}
    </div>
  );
}