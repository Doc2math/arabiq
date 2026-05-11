"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OralItem {
  ar: string;
  translation: string;
  syllables?: string;
  phoneme?: string;
  audio?: string;
  audio_url?: string;
}

interface OralPracticeData {
  letters: OralItem[];
  words: OralItem[];
  sentences: OralItem[];
}

interface OralPracticeExerciseProps {
  data: OralPracticeData;
  onQuit: () => void;
  onComplete: (stats: { letters: number; words: number; sentences: number }) => void;
  apiBaseUrl?: string;
}

type Mode = "letters" | "words" | "sentences";
type RecordPhase = "idle" | "recording" | "evaluating" | "result";
type ResultLevel = "l1" | "l2" | "l3" | "l4" | "l5" | "l6" | "l7" | null;

// ─── Couleurs ─────────────────────────────────────────────────────────────────

const C = {
  bg: "transparent",
  surface: "#F8F7FF",
  border: "#E8E4F8",
  accent: "#6C3FC5",
  gold: "#F07C1E",
  green: "#2BA84A",
  greenLt: "#E3F7E8",
  red: "#E24B4A",
  text: "#1A1A2E",
  text2: "#5A5A7A",
  text3: "#9A9AB0",
  white: "#FFFFFF",
};



function scoreToLevel(score: number): ResultLevel {
  if (score >= 81) return "l7";
  if (score >= 69) return "l6";
  if (score >= 53) return "l5";
  if (score >= 49) return "l4";
  if (score >= 31) return "l3";
  if (score >= 16) return "l2";
  return "l1";
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildLetterPasses(letters: OralItem[]): OralItem[][] {
  const shuffled = shuffle(letters);
  const perPass = Math.ceil(shuffled.length / 4);
  return [0, 1, 2, 3].map(i => shuffled.slice(i * perPass, (i + 1) * perPass));
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function OralPracticeExercise({
  data,
  onQuit,
  onComplete,
  apiBaseUrl,
}: OralPracticeExerciseProps) {
  const t = useTranslations("oral");
  const RESULT_LEVELS = {
  l1: { bg: "#FFEBEB", border: "#E24B4A", text: "#8B1A1A", label: t("level_l1"), icon: "✗" },
  l2: { bg: "#FDECEA", border: "#D9534F", text: "#7A1A1A", label: t("level_l2"), icon: "✗" },
  l3: { bg: "#FEF0E3", border: "#E8833A", text: "#7A3A00", label: t("level_l3"), icon: "↗" },
  l4: { bg: "#FEF6E0", border: "#F0B429", text: "#7A5A00", label: t("level_l4"), icon: "↗" },
  l5: { bg: "#FFFBE6", border: "#D4AC0D", text: "#6A5000", label: t("level_l5"), icon: "↗" },
  l6: { bg: "#EBF9EE", border: "#48BB78", text: "#1A6630", label: t("level_l6"), icon: "✓" },
  l7: { bg: "#E3F7E8", border: "#2BA84A", text: "#1A6630", label: t("level_l7"), icon: "✓" },
};
  const baseUrl = apiBaseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  // ── States ──────────────────────────────────────────────────────────────────
  const [mode, setMode]                                 = useState<Mode>("letters");
  const [currentPass, setCurrentPass]                   = useState(0);
  const [idx, setIdx]                                   = useState(0);
  const [stats, setStats]                               = useState({ letters: 0, words: 0, sentences: 0 });
  const [recordPhase, setRecordPhase]                   = useState<RecordPhase>("idle");
  const [resultLevel, setResultLevel]                   = useState<ResultLevel>(null);
  const [resultScore, setResultScore]                   = useState(0);
  const [resultFeedback, setResultFeedback]             = useState("");
  const [resultRecommandation, setResultRecommandation] = useState("");

  // ── Refs ────────────────────────────────────────────────────────────────────
  const letterPasses     = useRef(buildLetterPasses(data.letters));
  const wordItems        = useRef(shuffle(data.words).slice(0, 4));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const mimeRef          = useRef("");
  const displayRef       = useRef<HTMLDivElement>(null);
  const modeBarRef       = useRef<HTMLDivElement>(null);

  // ── Items courants ──────────────────────────────────────────────────────────
  const currentItems: OralItem[] =
    mode === "letters" ? (letterPasses.current[currentPass] ?? []) :
    mode === "words"   ? wordItems.current :
    data.sentences;

  const currentItem = currentItems[idx] ?? currentItems[0];
  const total       = currentItems.length;

  const modeConfig = {
    letters:   { label: t("letters"),   icon: "أ",  color: C.accent },
    words:     { label: t("words"),     icon: "كـ", color: C.gold   },
    sentences: { label: t("sentences"), icon: "◌ّ", color: C.green  },
  };

  const activeColor = modeConfig[mode].color;
  const rc = resultLevel ? RESULT_LEVELS[resultLevel] : null;

  // ── Animations ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (displayRef.current) {
      gsap.fromTo(displayRef.current,
        { opacity: 0, y: 16, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.4)" }
      );
    }
  }, [idx, mode, currentPass]);

  useEffect(() => {
    if (modeBarRef.current) {
      gsap.fromTo(Array.from(modeBarRef.current.children),
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0.07, ease: "power2.out" }
      );
    }
  }, []);

  // ── Écouter ─────────────────────────────────────────────────────────────────

  const handleListen = useCallback(() => {
    const src = currentItem?.audio ?? currentItem?.audio_url;
    if (src) new Audio(src).play().catch(() => {});
  }, [currentItem]);

  // ── Évaluation audio ────────────────────────────────────────────────────────

  const evaluateAudio = useCallback(async () => {
    const audioBlob = new Blob(chunksRef.current, { type: mimeRef.current || "audio/webm" });
    const formData = new FormData();
    const lang = localStorage.getItem("langdad_lang") ?? "fr"
    formData.append("lang", lang)
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("expected_arabic", currentItem.ar);
    formData.append("translation", currentItem.translation);
    formData.append("exercise_type",
      mode === "letters" ? "letter" : mode === "words" ? "word" : "sentence"
    );

    try {
      const token = localStorage.getItem("access_token");
      
      const res = await fetch(`${baseUrl}/api/v1/oral/evaluate`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (res.status === 429) {
        const err = await res.json();
        setResultFeedback(err.detail);
        setResultRecommandation("");
        setResultLevel("l1");
        setResultScore(0);
        setRecordPhase("result");
        return;
      }
      if (res.status === 403) {
        setResultFeedback("L'évaluation orale est réservée aux abonnés premium.");
        setResultRecommandation("");
        setResultLevel("l1");
        setResultScore(0);
        setRecordPhase("result");
        return;
      }
      if (!res.ok) throw new Error();

      const result = await res.json();
      const score: number = result.score ?? 0;
      const level = scoreToLevel(score);

      setResultScore(score);
      setResultLevel(level);
      setResultFeedback(result.feedback ?? "");
      setResultRecommandation(result.recommandation ?? "");
      setRecordPhase("result");

      if (level === "l6" || level === "l7") {
        setStats(prev => ({ ...prev, [mode]: prev[mode] + 1 }));
        if (displayRef.current) {
          gsap.fromTo(displayRef.current,
            { scale: 1 },
            { scale: 1.04, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.inOut" }
          );
        }
      }
    } catch {
      setResultLevel("l1");
      setResultFeedback("Erreur de connexion.");
      setResultRecommandation("");
      setRecordPhase("result");
    }
  }, [currentItem, baseUrl, mode]);

  // ── Enregistrement ──────────────────────────────────────────────────────────

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecordPhase("evaluating");
  }, []);

  const startRecording = useCallback(async () => {
    setResultLevel(null);
    setResultFeedback("");
    setResultRecommandation("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      mimeRef.current = recorder.mimeType;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        evaluateAudio();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordPhase("recording");
    } catch {
      setRecordPhase("idle");
    }
  }, [evaluateAudio]);

  const handleRecord = useCallback(() => {
    if (recordPhase === "recording") stopRecording();
    else if (recordPhase === "idle" || recordPhase === "result") startRecording();
  }, [recordPhase, stopRecording, startRecording]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    setRecordPhase("idle");
    setResultLevel(null);
    setResultFeedback("");
    setResultRecommandation("");
    if (idx + 1 >= total) {
      if (mode === "letters" && currentPass < 3) {
        setCurrentPass(p => p + 1);
        setIdx(0);
      } else {
        onComplete(stats);
      }
    } else {
      setIdx(i => i + 1);
    }
  }, [idx, total, mode, currentPass, stats, onComplete]);

  const handleModeChange = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setIdx(0);
    setCurrentPass(0);
    setRecordPhase("idle");
    setResultLevel(null);
    setResultFeedback("");
    setResultRecommandation("");
  };

  const passLabel = mode === "letters"
    ? `${t("pass")} ${currentPass + 1} ${t("of")} 4 — ${idx + 1} ${t("of")} ${total}`
    : `${idx + 1} ${t("of")} ${total}`;

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Barre de modes + Quitter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div ref={modeBarRef} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["letters", "words", "sentences"] as Mode[]).map(m => {
            const cfg = modeConfig[m];
            const active = mode === m;
            return (
              <button key={m} onClick={() => handleModeChange(m)} style={{
                padding: "9px 18px", borderRadius: 50,
                border: `2px solid ${active ? cfg.color : C.border}`,
                background: active ? cfg.color : C.white,
                color: active ? C.white : C.text2,
                fontSize: 13, fontWeight: active ? 700 : 400,
                cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <span style={{ fontFamily: "'Amiri', serif", fontSize: 16 }}>{cfg.icon}</span>
                {cfg.label}
              </button>
            );
          })}
        </div>
        <button onClick={onQuit} style={{
          padding: "8px 18px", borderRadius: 50,
          border: `1.5px solid ${C.border}`, background: "transparent",
          color: C.text3, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.red; (e.currentTarget as HTMLElement).style.color = C.red; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.text3; }}
        >
          {t("quit")}
        </button>
      </div>

      {/* Progression */}
      <div style={{ fontSize: 12, color: C.text3 }}>
        {modeConfig[mode].label} — {passLabel}
      </div>

      {/* Zone principale */}
      <div style={{ display: "flex", gap: "1.25rem", alignItems: "stretch", flexWrap: "wrap" }}>

        {/* Carte lettre/mot/phrase */}
        <div ref={displayRef} style={{
          flex: "1 1 280px", background: C.surface,
          border: `2px solid ${rc ? rc.border : recordPhase === "recording" ? activeColor : C.border}`,
          borderRadius: 20, padding: "2rem 1.5rem",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "0.75rem", minHeight: 180,
          transition: "border-color 0.3s ease", position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 12, left: 12,
            fontSize: 10, fontWeight: 700, padding: "3px 10px",
            borderRadius: 20, background: `${activeColor}18`, color: activeColor,
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            {modeConfig[mode].label}
          </div>

          <div style={{
            fontFamily: "'Amiri', 'Noto Naskh Arabic', serif",
            fontSize: mode === "sentences" ? "2rem" : "3.5rem",
            color: C.text, direction: "rtl", lineHeight: 1.3, textAlign: "center",
          }}>
            {currentItem?.ar}
          </div>

          <div style={{ fontSize: 15, color: C.text2, textAlign: "center" }}>
            {currentItem?.translation}
          </div>

          {currentItem?.phoneme && (
            <div style={{ fontSize: 13, color: C.text3, fontStyle: "italic" }}>
              [{currentItem.phoneme}]
            </div>
          )}

          {currentItem?.syllables && mode !== "sentences" && (
            <div style={{ fontSize: 13, color: activeColor, fontFamily: "'Amiri', serif", direction: "rtl", opacity: 0.8 }}>
              {currentItem.syllables}
            </div>
          )}

          {recordPhase === "recording" && (
            <div style={{
              position: "absolute", bottom: 12, right: 12,
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, color: C.red, fontWeight: 600,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", background: C.red,
                display: "inline-block", animation: "oralPulse 1s ease-in-out infinite",
              }} />
              {t("listening")}
            </div>
          )}
        </div>

        {/* Boutons */}
        <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: 10, justifyContent: "center", minWidth: 150 }}>
          <button onClick={handleListen}
            disabled={recordPhase === "recording" || recordPhase === "evaluating"}
            style={{
              padding: "13px 18px", borderRadius: 14,
              border: `2px solid ${C.border}`, background: C.white, color: C.text,
              fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              transition: "all 0.15s", opacity: recordPhase === "evaluating" ? 0.5 : 1,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.gold; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
          >
            <span style={{ fontSize: 18 }}>◁</span> {t("listen")}
          </button>

          <button onClick={handleRecord} disabled={recordPhase === "evaluating"}
            style={{
              padding: "15px 18px", borderRadius: 14,
              border: `2px solid ${recordPhase === "recording" ? C.red : activeColor}`,
              background: recordPhase === "recording" ? C.red : activeColor,
              color: C.white, fontSize: 14, fontWeight: 700,
              cursor: recordPhase === "evaluating" ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "all 0.2s", opacity: recordPhase === "evaluating" ? 0.6 : 1, minHeight: 52,
            }}
          >
            {recordPhase === "recording"  && <><span style={{ fontSize: 16 }}>■</span> {t("finished")}</>}
            {recordPhase === "evaluating" && <span style={{ fontSize: 13 }}>{t("analyzing")}</span>}
            {(recordPhase === "idle" || recordPhase === "result") && <><span style={{ fontSize: 16 }}>●</span> {t("pronounce")}</>}
          </button>

          <button onClick={handleNext}
            disabled={recordPhase === "recording" || recordPhase === "evaluating"}
            style={{
              padding: "13px 18px", borderRadius: 14,
              border: `2px solid ${C.border}`, background: C.white,
              color: recordPhase === "result" ? C.text : C.text3,
              fontSize: 14, fontWeight: recordPhase === "result" ? 600 : 400,
              cursor: recordPhase === "recording" || recordPhase === "evaluating" ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: 10,
              transition: "all 0.15s",
              opacity: recordPhase === "recording" || recordPhase === "evaluating" ? 0.4 : 1,
            }}
            onMouseEnter={e => { if (recordPhase === "result") (e.currentTarget as HTMLElement).style.borderColor = C.green; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
          >
            {t("next")}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {resultLevel && rc && (
        <div style={{
          background: rc.bg, border: `2px solid ${rc.border}`,
          borderRadius: 20, overflow: "hidden",
        }}>
          {/* Bande supérieure */}
          <div style={{
            background: rc.border, padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 700, color: C.white,
              }}>
                {rc.icon}
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.white }}>
                {rc.label}
              </span>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.2)", borderRadius: 30,
              padding: "4px 14px", fontSize: 15, fontWeight: 700, color: C.white,
            }}>
              {resultScore} / 100
            </div>
          </div>

          {/* Corps */}
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 15, color: rc.text, lineHeight: 1.6, fontWeight: 500 }}>
              {resultFeedback}
            </div>
            {resultRecommandation && (
              <div style={{
                background: "rgba(255,255,255,0.6)",
                border: `1.5px solid ${rc.border}40`,
                borderRadius: 12, padding: "12px 16px",
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>💡</span>
                <div style={{ fontSize: 13, color: rc.text, lineHeight: 1.65, fontStyle: "italic" }}>
                  {resultRecommandation}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barre de progression */}
      <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${((idx + 1) / total) * 100}%`,
          background: activeColor, borderRadius: 2, transition: "width 0.4s ease",
        }} />
      </div>

      <style>{`
        @keyframes oralPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}