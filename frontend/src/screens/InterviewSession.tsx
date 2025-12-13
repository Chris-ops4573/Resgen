import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE || "http://localhost:8000";

type LocationState = {
  firstQuestion?: string;
};

function GlassCard({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={[
        "group relative rounded-2xl p-6 md:p-8",
        "bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60",
        "border border-zinc-200/70 ring-1 ring-black/5",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset,0_10px_30px_-10px_rgba(0,0,0,0.18)]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent
        [background:radial-gradient(1200px_600px_at_0%_-20%,rgba(14,165,233,0.08),transparent_40%),
                     radial-gradient(1200px_600px_at_100%_120%,rgba(99,102,241,0.08),transparent_40%)]"
      />
      <div className="relative">
        {(title || subtitle) && (
          <div className="mb-5">
            {title && (
              <h2 className="text-[22px] md:text-2xl font-semibold tracking-tight text-zinc-900">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900">
                  {title}
                </span>
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-zinc-600 mt-1">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export default function InterviewSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [question, setQuestion] = useState<string | null>(
    state?.firstQuestion ?? null
  );
  const [answer, setAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalAssessment, setFinalAssessment] = useState<any | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  /* ---------- Text-to-Speech ---------- */
  function speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (question) speak(question);
  }, [question]);

  /* ---------- Speech-to-Text ---------- */
  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm",
    });

    audioChunksRef.current = [];
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      await sendAudioForTranscription(audioBlob);
    };

    mediaRecorder.start();
    setIsRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  async function sendAudioForTranscription(audioBlob: Blob) {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "answer.webm");

      const res = await fetch(`${API_BASE}/interview/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Transcription failed");

      const data = await res.json();
      setAnswer(data.transcript); // Editable text
    } catch (err) {
      alert("Failed to transcribe audio");
    }
  }


  /* ---------- Submit Answer ---------- */
  async function submitAnswer() {
    if (!answer.trim() || !sessionId) return;

    try {
      setIsSubmitting(true);

      const res = await fetch(`${API_BASE}/interview/submit_answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, answer }),
      });

      if (!res.ok) throw new Error("Failed to submit answer");

      const data = await res.json();

      if (data.is_final || data.interview_complete) {
        setFinalAssessment(data.final_assessment);
        return;
      }

      setAnswer("");
      setQuestion(data.question);
    } catch {
      alert("Error submitting answer");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ---------- FINAL SCREEN ---------- */
if (finalAssessment) {
  const score = finalAssessment.overall_fit;

  const recommendationColor =
    finalAssessment.recommendation === "strong_yes"
      ? "text-green-700"
      : finalAssessment.recommendation === "yes"
      ? "text-emerald-700"
      : finalAssessment.recommendation === "maybe"
      ? "text-amber-700"
      : "text-red-700";

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-zinc-50 to-white px-4">
      <div className="max-w-2xl w-full rounded-2xl bg-white/80 backdrop-blur border border-zinc-200 shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Interview Result</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Session ID: {sessionId} • {finalAssessment.total_turns ?? "—"} turns
          </p>
        </div>

        {/* Score */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div>
            <div className="text-sm text-zinc-600">Overall Fit Score</div>
            <div className="text-3xl font-semibold text-zinc-900">{score}</div>
          </div>

          <div className="text-right">
            <div className="text-sm text-zinc-600">Recommendation</div>
            <div className={`text-lg font-semibold ${recommendationColor}`}>
              {finalAssessment.recommendation.replace("_", " ").toUpperCase()}
            </div>
          </div>
        </div>

        {/* Summary */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-800 mb-2">
            Summary
          </h3>
          <p className="text-sm text-zinc-700 leading-relaxed">
            {finalAssessment.summary}
          </p>
        </section>

        {/* Strengths */}
        {finalAssessment.strengths?.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-zinc-800 mb-2">
              Strengths
            </h3>
            <ul className="list-disc pl-5 text-sm text-zinc-700 space-y-1">
              {finalAssessment.strengths.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Weaknesses */}
        {finalAssessment.weaknesses?.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-zinc-800 mb-2">
              Weaknesses
            </h3>
            <ul className="list-disc pl-5 text-sm text-zinc-700 space-y-1">
              {finalAssessment.weaknesses.map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Hiring Risks */}
        {finalAssessment.hiring_risks?.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-zinc-800 mb-2">
              Hiring Risks
            </h3>
            <ul className="list-disc pl-5 text-sm text-zinc-700 space-y-1">
              {finalAssessment.hiring_risks.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer actions */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={() => window.location.href = "/"}
            className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white
                      hover:bg-zinc-800 transition"
          >
            Back to Resume Builder
          </button>
        </div>
      </div>
    </div>
  );
}

  /* ---------- INTERVIEW UI ---------- */
  return (
    <div className="min-h-dvh text-zinc-900 antialiased">
      {/* Ambient background (same as ResumeBuilder) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 to-white" />
        <div className="absolute -top-24 -left-24 h-[38rem] w-[38rem] rounded-full
          bg-[radial-gradient(closest-side,rgba(14,165,233,0.12),transparent)] blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-[36rem] w-[36rem] rounded-full
          bg-[radial-gradient(closest-side,rgba(99,102,241,0.12),transparent)] blur-3xl" />
      </div>

      <main className="mx-auto max-w-2xl px-4 py-10 grid gap-6">
        <GlassCard
          title="Interview Question"
          subtitle={`Session ${sessionId}`}
        >
          <p className="text-zinc-800 leading-relaxed mb-6">
            {question ?? "Loading question…"}
          </p>

          {/* Mic */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={[
                "h-14 w-14 rounded-full text-white text-xl flex items-center justify-center",
                "shadow-lg transition active:translate-y-[1px]",
                isRecording
                  ? "bg-red-600 animate-pulse"
                  : "bg-gradient-to-b from-indigo-600 to-indigo-800 hover:from-indigo-500",
              ].join(" ")}
            >
              🎤
            </button>

            <div className="text-sm text-zinc-600">
              {isRecording ? "Listening… click again to stop" : "Tap to record your answer"}
            </div>
          </div>

          {/* Transcript */}
          <div className="grid gap-2 mb-6">
            <span className="text-sm font-medium text-zinc-800">Your answer</span>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your transcribed answer will appear here…"
              rows={4}
              className="w-full rounded-xl border border-zinc-200 bg-white/70 shadow-inner
                        px-3.5 py-2.5 text-sm text-zinc-900
                        focus-visible:outline-none focus-visible:ring-4
                        focus-visible:ring-indigo-500/20"
            />
          </div>

          <button
            onClick={submitAnswer}
            disabled={isSubmitting || !answer}
            className="w-full rounded-2xl bg-gradient-to-b from-zinc-900 to-black
                      py-3 text-sm font-medium text-white
                      shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_20px_-10px_rgba(0,0,0,0.5)]
                      disabled:opacity-50 transition"
          >
            {isSubmitting ? "Submitting…" : "Submit answer"}
          </button>
        </GlassCard>
      </main>
    </div>
  );
}
