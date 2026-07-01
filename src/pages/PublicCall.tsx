import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Loader2, Mic, CheckCircle2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getPublicCallConfig,
  startCallSession,
  callTurn,
  completeCallSession,
  type PublicCallConfig,
  type CallSessionResult,
} from "@/lib/backend-api";

type Phase = "loading" | "error" | "closed" | "ready" | "connecting" | "in-call" | "done";
type Mode = "speaking" | "listening";
type Turn = { role: "assistant" | "user"; text: string };

// Per-answer recording cap keeps the uploaded audio well under the API body limit.
const MAX_ANSWER_SECONDS = 60;
const SILENCE_MS = 2500; // pause after this much silence once the caller has spoken
const GRACE_MS = 4000; // after a pause, wait this long before auto-sending unless the caller continues

function getToken(): string {
  if (typeof window === "undefined") return "";
  const parts = window.location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("call");
  return idx >= 0 && parts[idx + 1] ? decodeURIComponent(parts[idx + 1]) : "";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function PublicCall() {
  const [token] = useState(getToken);
  const [phase, setPhase] = useState<Phase>("loading");
  const [mode, setMode] = useState<Mode>("speaking");
  const [config, setConfig] = useState<PublicCallConfig | null>(null);
  const [error, setError] = useState("");
  const [callerName, setCallerName] = useState("");
  const [callerEmail, setCallerEmail] = useState("");
  const [conversation, setConversation] = useState<Turn[]>([]);
  const [result, setResult] = useState<CallSessionResult | null>(null);
  const [paused, setPaused] = useState(false); // caller went quiet — awaiting continue/send
  const [graceLeft, setGraceLeft] = useState(0); // seconds until the paused answer auto-sends
  const [showTranscript, setShowTranscript] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  const activeRef = useRef(false); // loop guard
  const manualStopRef = useRef<(() => void) | null>(null); // commit the current answer now
  const resumeRef = useRef<(() => void) | null>(null); // resume a paused answer
  const graceTimerRef = useRef<number | null>(null); // countdown before auto-send

  // ── Load config ────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setError("Invalid call link.");
      setPhase("error");
      return;
    }
    getPublicCallConfig(token)
      .then((cfg) => {
        setConfig(cfg);
        setPhase(cfg.isOpen ? "ready" : "closed");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Call not found.");
        setPhase("error");
      });
  }, [token]);

  const cleanup = useCallback(() => {
    activeRef.current = false;
    manualStopRef.current = null;
    resumeRef.current = null;
    if (graceTimerRef.current != null) {
      window.clearInterval(graceTimerRef.current);
      graceTimerRef.current = null;
    }
    setPaused(false);
    setGraceLeft(0);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const playAudio = useCallback((base64: string, mime: string) => {
    return new Promise<void>((resolve) => {
      if (!base64) return resolve();
      const audio = new Audio(`data:${mime};base64,${base64}`);
      audioElRef.current = audio;
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  }, []);

  // Record one answer; resolves with base64 audio when the caller commits it
  // (taps "Send answer", the grace countdown lapses, or the per-answer cap is
  // hit). A detected pause no longer ends the answer outright — it holds the
  // recording paused so the caller can resume the same take via "Continue".
  const recordAnswer = useCallback((): Promise<{ base64: string; mime: string } | null> => {
    return new Promise((resolve) => {
      const stream = streamRef.current;
      if (!stream) return resolve(null);

      const preferred = "audio/webm";
      const supported =
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(preferred);
      const rec = new MediaRecorder(
        stream,
        supported ? { mimeType: preferred, audioBitsPerSecond: 32000 } : undefined,
      );
      const chunks: Blob[] = [];
      let settled = false;
      const startedAt = Date.now();

      const clearGrace = () => {
        if (graceTimerRef.current != null) {
          window.clearInterval(graceTimerRef.current);
          graceTimerRef.current = null;
        }
      };

      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = async () => {
        if (settled) return;
        settled = true;
        manualStopRef.current = null;
        resumeRef.current = null;
        clearGrace();
        setPaused(false);
        setGraceLeft(0);
        const mime = rec.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: mime });
        resolve({ base64: await blobToBase64(blob), mime });
      };

      // Commit the current answer (works whether recording or paused).
      const stop = () => {
        if (rec.state === "recording" || rec.state === "paused") rec.stop();
      };
      manualStopRef.current = stop;

      // Start (or restart, after a resume) silence detection for this take.
      // `alreadySpoke` is true on resume so a fresh pause re-arms the countdown.
      const startVad = (alreadySpoke: boolean) => {
        try {
          const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          const ctx = audioCtxRef.current ?? new Ctx();
          audioCtxRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          const buf = new Uint8Array(analyser.frequencyBinCount);
          let spoke = alreadySpoke;
          let silenceStart = 0;

          const tick = () => {
            if (rec.state !== "recording") {
              source.disconnect();
              return;
            }
            analyser.getByteTimeDomainData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i++) {
              const d = buf[i] - 128;
              sum += d * d;
            }
            const rms = Math.sqrt(sum / buf.length);
            const now = Date.now();
            if (rms > 6) {
              spoke = true;
              silenceStart = 0;
            } else if (spoke) {
              if (!silenceStart) silenceStart = now;
              else if (now - silenceStart > SILENCE_MS) {
                source.disconnect();
                pauseForGrace();
                return;
              }
            }
            if (now - startedAt > MAX_ANSWER_SECONDS * 1000) {
              source.disconnect();
              stop();
              return;
            }
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        } catch {
          // No silence detection available — rely on the manual buttons.
        }
      };

      // A pause was detected: hold the recording and start the auto-send
      // countdown, which the caller can cancel by continuing.
      const pauseForGrace = () => {
        if (rec.state !== "recording") return;
        rec.pause();
        setPaused(true);
        const deadline = Date.now() + GRACE_MS;
        setGraceLeft(Math.ceil(GRACE_MS / 1000));
        clearGrace();
        graceTimerRef.current = window.setInterval(() => {
          const left = deadline - Date.now();
          if (left <= 0) {
            clearGrace();
            stop(); // auto-send the answer
          } else {
            setGraceLeft(Math.ceil(left / 1000));
          }
        }, 200);
      };

      // Caller tapped "Continue answering": resume the same take.
      const resume = () => {
        if (rec.state !== "paused") return;
        clearGrace();
        setPaused(false);
        setGraceLeft(0);
        rec.resume();
        startVad(true);
      };
      resumeRef.current = resume;

      rec.start();
      startVad(false);
    });
  }, []);

  const finish = useCallback(async () => {
    activeRef.current = false;
    setPhase("connecting");
    try {
      if (sessionIdRef.current != null) {
        const res = await completeCallSession(token, { callSessionId: sessionIdRef.current });
        setResult(res);
      }
    } catch {
      /* still show the done screen */
    } finally {
      cleanup();
      setPhase("done");
    }
  }, [token, cleanup]);

  // The conversation loop: play AI line → record answer → send → repeat.
  const runLoop = useCallback(async () => {
    while (activeRef.current) {
      setMode("listening");
      const answer = await recordAnswer();
      if (!activeRef.current) return;

      setMode("speaking");
      const res = await callTurn(token, {
        callSessionId: sessionIdRef.current as number,
        audioBase64: answer?.base64,
        mimeType: answer?.mime,
      });
      if (!activeRef.current) return;

      setConversation((c) => [
        ...c,
        ...(res.transcribed ? [{ role: "user" as const, text: res.transcribed }] : []),
        { role: "assistant" as const, text: res.replyText },
      ]);
      await playAudio(res.audioBase64, res.mimeType);

      if (res.done) {
        await finish();
        return;
      }
    }
  }, [token, recordAnswer, playAudio, finish]);

  const startCall = useCallback(async () => {
    if (!token) return;
    if (!/.+@.+\..+/.test(callerEmail.trim())) {
      setError("Please enter a valid email to continue.");
      return;
    }
    setError("");
    setPhase("connecting");
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const session = await startCallSession(token, {
        callerName: callerName.trim() || undefined,
        callerEmail: callerEmail.trim() || undefined,
      });
      sessionIdRef.current = session.callSessionId;
      activeRef.current = true;
      setConversation([{ role: "assistant", text: session.replyText }]);
      setPhase("in-call");
      setMode("speaking");
      await playAudio(session.audioBase64, session.mimeType);
      if (session.done) {
        await finish();
        return;
      }
      void runLoop();
    } catch (e) {
      cleanup();
      setError(e instanceof Error ? e.message : "Could not start the call.");
      setPhase("error");
    }
  }, [token, callerName, callerEmail, playAudio, runLoop, finish, cleanup]);

  const endNow = useCallback(() => {
    manualStopRef.current?.();
    void finish();
  }, [finish]);

  const lastTurns = conversation.slice(-4);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-background to-muted/40 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        {phase === "loading" && (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        )}

        {phase === "error" && (
          <>
            <PhoneOff className="mx-auto mb-3 h-10 w-10 text-red-500" />
            <h1 className="mb-1 text-lg font-semibold">Unable to start</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        )}

        {phase === "closed" && config && (
          <>
            <Phone className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h1 className="mb-1 text-lg font-semibold">{config.title}</h1>
            <p className="text-sm text-muted-foreground">
              This call opens on{" "}
              {config.scheduledAt
                ? new Date(config.scheduledAt).toLocaleString()
                : "a scheduled time"}
              . Please come back then.
            </p>
          </>
        )}

        {phase === "ready" && config && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-1 text-lg font-semibold">{config.title}</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              You're about to start a voice call. Find a quiet spot and allow microphone access. The interviewer will speak, then it's your turn — just talk, and it moves on when you pause.
            </p>
            <Input
              value={callerName}
              onChange={(e) => setCallerName(e.target.value)}
              placeholder="Your name (optional)"
              className="mb-3"
            />
            <Input
              type="email"
              value={callerEmail}
              onChange={(e) => setCallerEmail(e.target.value)}
              placeholder="Your email (required)"
              className="mb-2"
            />
            {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
            <Button className="w-full" onClick={() => void startCall()}>
              <Mic className="mr-2 h-4 w-4" /> Start call
            </Button>
          </>
        )}

        {phase === "connecting" && (
          <>
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Connecting…</p>
          </>
        )}

        {phase === "in-call" && (
          <>
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                mode === "speaking"
                  ? "bg-primary/10"
                  : paused
                    ? "bg-amber-500/15"
                    : "bg-emerald-500/15"
              }`}
            >
              {mode === "speaking" ? (
                <Volume2 className="h-8 w-8 text-primary" />
              ) : paused ? (
                <Mic className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              ) : (
                <span className="relative flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
                </span>
              )}
            </div>
            <h1 className="mb-1 text-lg font-semibold">
              {mode === "speaking"
                ? "Interviewer speaking…"
                : paused
                  ? "Paused — still there?"
                  : "Listening — your turn"}
            </h1>
            <p className="mb-4 text-xs text-muted-foreground">
              {mode === "speaking"
                ? "Please wait for the question."
                : paused
                  ? `Sending your answer in ${graceLeft}s — continue if you're not done.`
                  : "Speak your answer. It moves on automatically when you pause."}
            </p>

            <div className="mb-4 max-h-44 space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-3 text-left">
              {lastTurns.map((t, i) => (
                <p key={i} className="text-sm">
                  <span className="font-medium">
                    {t.role === "assistant" ? "Interviewer: " : "You: "}
                  </span>
                  <span className="text-muted-foreground">{t.text}</span>
                </p>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {mode === "listening" && !paused && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => manualStopRef.current?.()}
                  >
                    Done answering
                  </Button>
                )}
                {mode === "listening" && paused && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => resumeRef.current?.()}
                    >
                      Continue answering
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => manualStopRef.current?.()}
                    >
                      Send answer{graceLeft ? ` (${graceLeft})` : ""}
                    </Button>
                  </>
                )}
                <Button variant="destructive" className="flex-1" onClick={endNow}>
                  <PhoneOff className="mr-2 h-4 w-4" /> End call
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setShowTranscript(true)}
              >
                View transcript
              </Button>
            </div>
          </>
        )}

        {phase === "done" && (
          <>
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
            <h1 className="mb-1 text-lg font-semibold">Call complete</h1>
            <p className="text-sm text-muted-foreground">
              Thank you{result?.callerName ? `, ${result.callerName}` : ""}! Your responses have been recorded.
            </p>
          </>
        )}
      </div>

      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transcript</DialogTitle>
          </DialogHeader>
          {conversation.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing has been said yet.
            </p>
          ) : (
            <div className="space-y-3 text-left">
              {conversation.map((t, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-muted-foreground">
                    {t.role === "assistant" ? "Interviewer" : "You"}
                  </p>
                  <p className="text-sm">{t.text}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
