import { useCallback, useRef, useState } from "react";
import { useSessionStore } from "../stores/useSessionStore";

/**
 * [5] VOICE Q&A LOOP orchestration:
 * Mic -> /api/stt -> /api/ask-guide (SSE) -> /api/tts-stream (audio)
 * with window.speechSynthesis fallback on TTS failure.
 */
export function useVoiceGuide(exhibitContext) {
  const persona = useSessionStore((s) => s.persona);
  const [status, setStatus] = useState("idle"); // idle | listening | thinking | speaking
  const [captions, setCaptions] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startListening = useCallback(async () => {
    setStatus("listening");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.start();
    mediaRecorderRef.current = recorder;
  }, []);

  const stopListeningAndSend = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    const stopped = new Promise((resolve) => {
      recorder.onstop = resolve;
    });
    recorder.stop();
    await stopped;

    setStatus("thinking");
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });

    const sttForm = new FormData();
    sttForm.append("file", blob, "speech.webm");
    const sttRes = await fetch("/api/stt", { method: "POST", body: sttForm });
    const { text: transcript } = await sttRes.json();

    const guideRes = await fetch("/api/ask-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, exhibitContext, persona })
    });

    const reader = guideRes.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      fullText += chunk;
      setCaptions(fullText);
    }

    setStatus("speaking");
    await speak(fullText, persona);
    setStatus("idle");
  }, [exhibitContext, persona]);

  return { status, captions, startListening, stopListeningAndSend };
}

async function speak(text, persona) {
  try {
    const res = await fetch("/api/tts-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, persona })
    });
    if (!res.ok) throw new Error("TTS upstream failed");
    const audio = new Audio(URL.createObjectURL(await res.blob()));
    await audio.play();
  } catch (e) {
    // Offline / quota fallback -> browser speech synthesis
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  }
}
