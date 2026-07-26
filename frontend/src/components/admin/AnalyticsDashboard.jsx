import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/apiClient";
import AdminShell, { Panel, StatusNote } from "./AdminShell.jsx";

const RANGES = [
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
  { id: "90", label: "Last 90 days" }
];

function isoDaysAgo(days) {
  return new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString();
}

function formatDuration(ms) {
  if (!ms) return "—";
  const minutes = Math.round(ms / 60000);
  return minutes >= 1 ? `${minutes} min` : `${Math.round(ms / 1000)}s`;
}

/** Staff dashboard over privacy-safe event counts. No visitor is identifiable here. */
export default function AnalyticsDashboard({ navigate }) {
  const [rangeDays, setRangeDays] = useState("30");
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async (days) => {
    try {
      const data = await apiRequest(`/api/admin/analytics/summary?from=${encodeURIComponent(isoDaysAgo(days))}`);
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    load(rangeDays);
  }, [rangeDays, load]);

  const maxDropOff = useMemo(
    () => Math.max(1, ...(summary?.routeDropOff || []).map((row) => row.count)),
    [summary]
  );

  return (
    <AdminShell
      title="Visitor analytics"
      subtitle="Aggregate counts only — no audio, camera frames, transcripts or recovery links are ever recorded."
      navigate={navigate}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {RANGES.map((range) => (
          <button
            key={range.id}
            type="button"
            className="adwa-chip"
            data-active={rangeDays === range.id}
            onClick={() => setRangeDays(range.id)}
          >
            {range.label}
          </button>
        ))}
      </div>

      <StatusNote tone="error">{error}</StatusNote>

      {summary && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Sessions" value={summary.totals.sessions} />
            <Metric label="Events" value={summary.totals.events} />
            <Metric label="Avg. time" value={formatDuration(summary.totals.averageDurationMs)} />
            <Metric label="Longest" value={formatDuration(summary.totals.longestDurationMs)} />
          </div>

          <Panel title="Most popular exhibits">
            <RankedList rows={summary.popularExhibits} emptyText="No exhibit views recorded in this range." />
          </Panel>

          <Panel title="Persona selection">
            <RankedList rows={summary.personaUsage} emptyText="No persona choices recorded in this range." />
          </Panel>

          <Panel title="Route drop-off by stop">
            {summary.routeDropOff.length === 0 ? (
              <p className="text-sm text-parchment/60">No itinerary progress recorded in this range.</p>
            ) : (
              <ul className="space-y-1.5">
                {summary.routeDropOff.map((row) => (
                  <li key={row.stopIndex} className="flex items-center gap-3 text-sm">
                    <span className="w-16 shrink-0 text-parchment/60">Stop {row.stopIndex + 1}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-obsidian-overlay">
                      <span
                        className="block h-full bg-gradient-to-r from-imperial-gold-dark to-imperial-gold"
                        style={{ width: `${Math.round((row.count / maxDropOff) * 100)}%` }}
                      />
                    </span>
                    <span className="w-10 shrink-0 text-right text-parchment/70">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Feature usage">
            <RankedList rows={summary.eventsByName} emptyText="No events recorded in this range." />
          </Panel>

          <Panel title="Service failures">
            {summary.serviceFailures.length === 0 ? (
              <p className="text-sm text-parchment/60">No service errors reported. </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {summary.serviceFailures.map((row) => (
                  <li key={`${row.service}-${row.code}`} className="flex justify-between border-b border-wanza-wood/50 py-1.5">
                    <span className="text-parchment/80">
                      {row.service || "unknown"} <span className="text-parchment/45">{row.code || ""}</span>
                    </span>
                    <span className="text-adwa-crimson-light">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </AdminShell>
  );
}

function Metric({ label, value }) {
  return (
    <div className="adwa-card p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-parchment/55">{label}</p>
      <p className="mt-1 font-display text-2xl text-imperial-gold">{value}</p>
    </div>
  );
}

function RankedList({ rows, emptyText }) {
  if (!rows || rows.length === 0) return <p className="text-sm text-parchment/60">{emptyText}</p>;
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <ul className="space-y-1.5">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center gap-3 text-sm">
          <span className="w-36 shrink-0 truncate text-parchment/80">{row.key}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-obsidian-overlay">
            <span
              className="block h-full bg-gradient-to-r from-adwa-emerald-dark to-adwa-emerald"
              style={{ width: `${Math.round((row.count / max) * 100)}%` }}
            />
          </span>
          <span className="w-10 shrink-0 text-right text-parchment/70">{row.count}</span>
        </li>
      ))}
    </ul>
  );
}
