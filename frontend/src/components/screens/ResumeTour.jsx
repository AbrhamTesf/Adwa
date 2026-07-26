import React, { useEffect, useState } from "react";
import { restoreRecoverySession } from "../../lib/sessionSync";
import { useTranslation } from "../../lib/i18n";

export default function ResumeTour({ navigate, recoveryToken }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState("restoring");
  const [message, setMessage] = useState(t("resume.restoring"));
  const [destination, setDestination] = useState("memoryDeck");

  useEffect(() => {
    let active = true;
    if (!recoveryToken) {
      setStatus("error");
      setMessage(t("resume.incompleteToken"));
      return undefined;
    }
    restoreRecoverySession(recoveryToken)
      .then((snapshot) => {
        if (!active) return;
        setDestination(snapshot.itinerary?.length ? "navigation" : "memoryDeck");
        setStatus("ready");
        setMessage(t("resume.readyMsg"));
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      })
      .catch((error) => active && (setStatus("error"), setMessage(error.message)));
    return () => { active = false; };
  }, [recoveryToken, t]);

  return (
    <main className="min-h-screen bg-obsidian bg-adwa-geometry px-6 py-12 text-parchment">
      <section className="mx-auto max-w-md adwa-glass p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-imperial-gold">{t("resume.savedTour")}</p>
        <h1 className="mt-2 text-3xl text-parchment">{status === "ready" ? t("resume.welcomeBack") : t("resume.resumeVisit")}</h1>
        <p className="mt-4 text-sm leading-6 text-parchment/75" role="status">{message}</p>
        {status === "restoring" && <div className="mx-auto mt-6 h-1.5 w-32 overflow-hidden rounded-full bg-obsidian-overlay"><div className="h-full w-2/3 animate-pulse rounded-full bg-imperial-gold" /></div>}
        {status === "ready" ? (
          <button type="button" className="adwa-btn-primary mt-7 w-full" onClick={() => navigate(destination)}>{t("resume.continueBtn")}</button>
        ) : status === "error" ? (
          <button type="button" className="adwa-btn-secondary mt-7 w-full" onClick={() => navigate("landing")}>{t("memoryDeck.startNewTour")}</button>
        ) : null}
      </section>
    </main>
  );
}