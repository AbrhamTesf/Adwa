import React, { useEffect, useId, useRef, useState } from "react";
import { useAuthStore } from "../../stores/useAuthStore";

const PASSWORD_MIN_LENGTH = 10;

const ROLE_OPTIONS = [
  { value: "tourist", label: "Tourist", hint: "Save your tour, badges and recap." },
  { value: "admin_staff", label: "Museum Admin Staff", hint: "Requires a staff invitation code." }
];

/** Mirrors the server-side rules so users are not bounced by a round trip. */
function validate({ mode, displayName, email, password, role, invitationCode }) {
  if (mode === "signUp" && (displayName.trim().length < 2 || displayName.trim().length > 80)) {
    return "Please enter a name between 2 and 80 characters.";
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    return "Please enter a valid email address.";
  }
  if (mode === "signUp") {
    if (password.length < PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return "Password must include at least one letter and one number.";
    }
    if (role === "admin_staff" && invitationCode.trim().length === 0) {
      return "Enter the staff invitation code provided by your administrator.";
    }
  } else if (password.length === 0) {
    return "Enter your password.";
  }
  return null;
}

/** Sign in / create account dialog, with the tourist vs staff role selector. */
export default function AuthModal({ open, initialMode = "signIn", onClose }) {
  const formId = useId();
  const dialogRef = useRef(null);
  const firstFieldRef = useRef(null);

  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const clearError = useAuthStore((state) => state.clearError);

  const [mode, setMode] = useState(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tourist");
  const [invitationCode, setInvitationCode] = useState("");
  const [message, setMessage] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return undefined;
    setMessage(null);
    setNotice(null);
    clearError();
    firstFieldRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, mode, clearError, onClose]);

  if (!open) return null;

  const isSignUp = mode === "signUp";

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);
    setNotice(null);

    const problem = validate({ mode, displayName, email, password, role, invitationCode });
    if (problem) {
      setMessage(problem);
      return;
    }

    const result = isSignUp
      ? await signUp({
          displayName: displayName.trim(),
          email: email.trim(),
          password,
          role,
          invitationCode: role === "admin_staff" ? invitationCode.trim() : undefined
        })
      : await signIn({ email: email.trim(), password });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    if (result.pendingApproval) {
      setNotice(result.message);
      setPassword("");
      return;
    }
    onClose?.();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-obsidian/80 backdrop-blur-sm px-4 py-6 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
        className="adwa-glass w-full max-w-md overflow-hidden p-5"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-imperial-gold">Adwa Lens</p>
            <h2 id={`${formId}-title`} className="font-display text-2xl">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-imperial-gold/30 px-3 py-1 text-sm text-parchment/70 transition-colors hover:text-parchment"
          >
            ✕
          </button>
        </div>

        <div role="tablist" aria-label="Authentication mode" className="mb-5 flex gap-2">
          {[
            { id: "signIn", label: "Sign in" },
            { id: "signUp", label: "Create account" }
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={mode === tab.id}
              data-active={mode === tab.id}
              className="adwa-chip flex-1"
              onClick={() => {
                setMode(tab.id);
                setMessage(null);
                setNotice(null);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <fieldset>
              <legend className="mb-2 text-xs uppercase tracking-[0.16em] text-parchment/60">
                I am signing up as
              </legend>
              <div className="grid gap-2">
                {ROLE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl2 border p-3 transition-colors ${
                      role === option.value
                        ? "border-imperial-gold bg-imperial-gold/10"
                        : "border-wanza-wood bg-obsidian-raised/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${formId}-role`}
                      value={option.value}
                      checked={role === option.value}
                      onChange={() => setRole(option.value)}
                      className="mt-1 accent-imperial-gold"
                    />
                    <span>
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="block text-xs text-parchment/60">{option.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {isSignUp && (
            <Field
              id={`${formId}-name`}
              label="Full name"
              value={displayName}
              onChange={setDisplayName}
              autoComplete="name"
              inputRef={firstFieldRef}
            />
          )}

          <Field
            id={`${formId}-email`}
            label={role === "admin_staff" && isSignUp ? "Staff email" : "Email"}
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            inputRef={isSignUp ? undefined : firstFieldRef}
          />

          <Field
            id={`${formId}-password`}
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            hint={isSignUp ? `At least ${PASSWORD_MIN_LENGTH} characters, with a letter and a number.` : null}
          />

          {isSignUp && role === "admin_staff" && (
            <Field
              id={`${formId}-invitation`}
              label="Staff invitation code"
              value={invitationCode}
              onChange={setInvitationCode}
              autoComplete="one-time-code"
              hint="Your account stays pending until an administrator approves it."
            />
          )}

          {message && (
            <p role="alert" className="rounded-xl2 border border-adwa-crimson/50 bg-adwa-crimson/10 px-3 py-2 text-sm text-adwa-crimson-light">
              {message}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-xl2 border border-adwa-emerald/50 bg-adwa-emerald/10 px-3 py-2 text-sm text-adwa-emerald-light">
              {notice}
            </p>
          )}

          <button type="submit" className="adwa-btn-primary w-full disabled:opacity-60" disabled={isSubmitting}>
            {isSubmitting ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-parchment/50">
          You can keep exploring without an account — signing in just saves your progress.
        </p>
      </div>
    </div>
  );
}

function Field({ id, label, value, onChange, type = "text", autoComplete, hint, inputRef }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs uppercase tracking-[0.16em] text-parchment/60">
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl2 border border-wanza-wood bg-obsidian-raised px-3 py-2.5 text-parchment outline-none transition-colors focus:border-imperial-gold"
      />
      {hint && <p className="mt-1 text-xs text-parchment/50">{hint}</p>}
    </div>
  );
}
