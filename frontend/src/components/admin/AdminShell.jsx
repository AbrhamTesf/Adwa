import React from "react";
import { useAuthStore } from "../../stores/useAuthStore";

/**
 * Common frame for staff screens. The server is the real authority on access —
 * this only avoids showing a wall of 403s to someone who wandered in.
 */
export default function AdminShell({ title, subtitle, navigate, requiredRole = "admin_staff", children }) {
  const status = useAuthStore((state) => state.status);
  const roles = useAuthStore((state) => state.roles);

  const permitted =
    requiredRole === "super_admin"
      ? roles.includes("super_admin")
      : roles.some((role) => role === "admin_staff" || role === "super_admin");

  return (
    <section className="min-h-screen bg-obsidian bg-adwa-geometry px-5 pb-10 pt-5 text-parchment">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-imperial-gold">Museum operations</p>
          <h1 className="font-display text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-parchment/70">{subtitle}</p>}
        </div>
        <button type="button" className="adwa-btn-secondary px-4 py-2 text-sm" onClick={() => navigate?.("landing")}>
          Exit
        </button>
      </header>

      {status === "unknown" && <p className="text-sm text-parchment/60">Checking your access…</p>}

      {status !== "unknown" && !permitted && (
        <div className="adwa-card border-adwa-crimson/40">
          <h2 className="font-display text-lg">Staff access required</h2>
          <p className="mt-2 text-sm text-parchment/70">
            {status === "authenticated"
              ? "Your account does not have the museum staff role needed for this area."
              : "Sign in with a museum staff account to open this area."}
          </p>
        </div>
      )}

      {status !== "unknown" && permitted && children}
    </section>
  );
}

export function Panel({ title, action, children }) {
  return (
    <div className="adwa-card mb-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function StatusNote({ tone = "info", children }) {
  if (!children) return null;
  const palette =
    tone === "error"
      ? "border-adwa-crimson/50 bg-adwa-crimson/10 text-adwa-crimson-light"
      : "border-adwa-emerald/50 bg-adwa-emerald/10 text-adwa-emerald-light";

  return (
    <p role={tone === "error" ? "alert" : "status"} className={`mt-3 rounded-xl2 border px-3 py-2 text-sm ${palette}`}>
      {children}
    </p>
  );
}
