import { useCallback, useRef, useState } from "react";
import { useSessionStore } from "../stores/useSessionStore";

/**
 * [5] VOICE Q&A LOOP orchestration:
 * Mic -> /api/stt -> /api/ask-guide (SSE) -> /api/tts-stream (audio)
 * Text Input -> /api/ask-guide (SSE) -> /api/tts-stream (audio)
 * with window.speechSynthesis fallback on TTS failure.
 */
export function useVoiceGuide(exhibitContext) {
  const persona = useSessionStore((s) => s.persona);
  const [status, setStatus] = useState("idle"); // idle | listening | thinking | speaking
  const [captions, setCaptions] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startListening = useCallback(async () => {
    try {
      setStatus("listening");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error("[useVoiceGuide] Mic access error:", err);
      setCaptions("Microphone access permission was denied or unavailable. Please type your question below.");
      setStatus("idle");
    }
  }, []);

  const sendTextQuestion = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!trimmed) return;

      try {
        setStatus("thinking");
        setCaptions("Consulting historical archives…");

        const guideRes = await fetch("/api/ask-guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: trimmed, exhibitContext, persona })
        });

        if (!guideRes.ok) {
          const errData = await guideRes.json().catch(() => ({}));
          throw new Error(errData.message || `Guide request failed (${guideRes.status})`);
        }

        const reader = guideRes.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setCaptions(fullText);
        }

        if (fullText) {
          setStatus("speaking");
          await speak(fullText, persona);
        }
      } catch (err) {
        console.error("[useVoiceGuide] Text question error:", err);
        setCaptions(`Unable to reach guide: ${err.message}. Please try again.`);
      } finally {
        setStatus("idle");
      }
    },
    [exhibitContext, persona]
  );

  const stopListeningAndSend = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setStatus("idle");
      return;
    }

    try {
      const stopped = new Promise((resolve) => {
        recorder.onstop = resolve;
      });
      recorder.stop();
      await stopped;

      // Stop track stream
      if (recorder.stream) {
        recorder.stream.getTracks().forEach((track) => track.stop());
      }

      if (chunksRef.current.length === 0) {
        setCaptions("No audio detected. Please try holding the mic button while speaking.");
        setStatus("idle");
        return;
      }

      setStatus("thinking");
      setCaptions("Processing your spoken question…");

      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      const sttForm = new FormData();
      sttForm.append("file", blob, "speech.webm");

      const sttRes = await fetch("/api/stt", { method: "POST", body: sttForm });
      if (!sttRes.ok) {
        const errJson = await sttRes.json().catch(() => ({}));
        throw new Error(errJson.message || "Speech transcription failed.");
      }

      const { text: transcript } = await sttRes.json();
      if (!transcript || !transcript.trim()) {
        setCaptions("I couldn't hear clearly. Please try speaking again or type your question.");
        setStatus("idle");
        return;
      }

      await sendTextQuestion(transcript);
    } catch (err) {
      console.error("[useVoiceGuide] STT / Voice loop error:", err);
      setCaptions(`Voice query error: ${err.message}`);
      setStatus("idle");
    }
  }, [sendTextQuestion]);

  const stopAudio = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* noop */
      }
    }
    window.speechSynthesis?.cancel();
    setStatus("idle");
  }, []);

  return {
    status,
    captions,
    setCaptions,
    startListening,
    stopListeningAndSend,
    sendTextQuestion,
    stopAudio
  };
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
    console.warn("[speak Fallback] Using window.speechSynthesis due to:", e.message);
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  }
}
