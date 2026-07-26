import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../../stores/useAuthStore";
import AuthModal from "./AuthModal.jsx";

function initials(displayName) {
  return (displayName || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

/**
 * Profile control for the app shell. Renders the signed-out prompt, the
 * tourist menu, or the staff menu with CMS and analytics links.
 *
 * `availableScreens` is the router's screen map — admin destinations that have
 * not shipped yet are shown as disabled rather than silently routing home.
 */
export default function AuthProfileMenu({ navigate, availableScreens = {} }) {
  const containerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);

  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const status = useAuthStore((state) => state.status);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const signOut = useAuthStore((state) => state.signOut);

  const isAdmin = roles.some((role) => role === "admin_staff" || role === "super_admin");

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function go(screen) {
    setMenuOpen(false);
    navigate?.(screen);
  }

  function openAuth(mode) {
    setMenuOpen(false);
    setAuthMode(mode);
  }

  const signedIn = status === "authenticated" && user;

  return (
    <>
      <div ref={containerRef} className="fixed right-4 top-4 z-40">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={signedIn ? `Account menu for ${user.displayName}` : "Sign in or create an account"}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-imperial-gold/40 bg-obsidian-raised/80 text-sm font-semibold text-imperial-gold shadow-gold-glow backdrop-blur-md transition-transform active:scale-95"
        >
          {signedIn ? (
            initials(user.displayName) || "•"
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {menuOpen && (
          <div
            role="menu"
            aria-label="Account"
            className="adwa-glass absolute right-0 mt-2 w-64 overflow-hidden p-2 text-sm"
          >
            {signedIn ? (
              <>
                <div className="border-b border-imperial-gold/15 px-3 pb-3 pt-2">
                  <p className="truncate font-semibold text-parchment">{user.displayName}</p>
                  <p className="truncate text-xs text-parchment/60">{user.email}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-imperial-gold">
                    {isAdmin ? "Museum staff" : "Tourist"}
                  </p>
                </div>

                <MenuItem onClick={() => go("memoryDeck")}>Saved tours &amp; badges</MenuItem>

                {isAdmin && (
                  <>
                    <p className="px-3 pb-1 pt-3 text-xs uppercase tracking-[0.14em] text-parchment/45">
                      Staff tools
                    </p>
                    <MenuItem onClick={() => go("cms")} disabled={!availableScreens.cms}>
                      Content management
                    </MenuItem>
                    <MenuItem onClick={() => go("analytics")} disabled={!availableScreens.analytics}>
                      Analytics dashboard
                    </MenuItem>
                    {roles.includes("super_admin") && (
                      <MenuItem onClick={() => go("staff")} disabled={!availableScreens.staff}>
                        Staff &amp; invitations
                      </MenuItem>
                    )}
                  </>
                )}

                <div className="mt-2 border-t border-imperial-gold/15 pt-2">
                  <MenuItem
                    onClick={async () => {
                      setMenuOpen(false);
                      await signOut();
                    }}
                  >
                    Sign out
                  </MenuItem>
                </div>
              </>
            ) : (
              <>
                <p className="px-3 pb-2 pt-2 text-xs text-parchment/60">
                  Sign in to save your tour, badges and recap across devices.
                </p>
                <MenuItem onClick={() => openAuth("signIn")}>Sign in</MenuItem>
                <MenuItem onClick={() => openAuth("signUp")}>Create account</MenuItem>
              </>
            )}
          </div>
        )}
      </div>

      <AuthModal open={Boolean(authMode)} initialMode={authMode || "signIn"} onClose={() => setAuthMode(null)} />
    </>
  );
}

function MenuItem({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Coming soon" : undefined}
      className="w-full rounded-xl2 px-3 py-2 text-left text-parchment transition-colors hover:bg-imperial-gold/10 disabled:cursor-not-allowed disabled:text-parchment/35 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
