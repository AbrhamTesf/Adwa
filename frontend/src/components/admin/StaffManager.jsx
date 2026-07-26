import React, { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/apiClient";
import AdminShell, { Panel, StatusNote } from "./AdminShell.jsx";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";
}

/** Super-admin screen: issue invitations, approve pending staff, review the audit trail. */
export default function StaffManager({ navigate }) {
  const [invitations, setInvitations] = useState([]);
  const [staff, setStaff] = useState([]);
  const [logs, setLogs] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [issuedCode, setIssuedCode] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [invitationData, staffData, logData] = await Promise.all([
        apiRequest("/api/admin/staff/invitations"),
        apiRequest("/api/admin/staff/users"),
        apiRequest("/api/admin/audit-logs?limit=25")
      ]);
      setInvitations(invitationData.invitations);
      setStaff(staffData.users);
      setLogs(logData.logs);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action, successMessage) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await action();
      setNotice(successMessage);
      await load();
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createInvitation(event) {
    event.preventDefault();
    setIssuedCode(null);
    const result = await run(
      () => apiRequest("/api/admin/staff/invitations", { method: "POST", body: { email: inviteEmail.trim() } }),
      "Invitation created."
    );
    if (result?.code) {
      setIssuedCode({ email: inviteEmail.trim(), code: result.code });
      setInviteEmail("");
    }
  }

  const pending = staff.filter((member) => member.status === "pending");

  return (
    <AdminShell
      title="Staff & invitations"
      subtitle="Invite museum staff, approve pending accounts and review administrative activity."
      navigate={navigate}
      requiredRole="super_admin"
    >
      <Panel title="Invite a staff member">
        <form onSubmit={createInvitation} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="curator@museum.example"
            aria-label="Staff email address"
            className="flex-1 rounded-xl2 border border-wanza-wood bg-obsidian-raised px-3 py-2.5 text-parchment outline-none focus:border-imperial-gold"
          />
          <button type="submit" className="adwa-btn-primary disabled:opacity-60" disabled={busy}>
            Create invitation
          </button>
        </form>

        {issuedCode && (
          <div className="mt-3 rounded-xl2 border border-imperial-gold/50 bg-imperial-gold/10 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-imperial-gold">
              Copy this code now — it is not stored and cannot be shown again
            </p>
            <code className="mt-2 block break-all font-mono text-sm text-parchment">{issuedCode.code}</code>
            <p className="mt-2 text-xs text-parchment/60">
              Send it to {issuedCode.email}. They enter it when creating a staff account.
            </p>
          </div>
        )}

        <StatusNote tone="error">{error}</StatusNote>
        <StatusNote>{notice}</StatusNote>
      </Panel>

      <Panel title={`Pending approvals (${pending.length})`}>
        {pending.length === 0 ? (
          <p className="text-sm text-parchment/60">No staff accounts are waiting for approval.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 rounded-xl2 border border-wanza-wood p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{member.displayName}</p>
                  <p className="truncate text-xs text-parchment/60">{member.email}</p>
                  <p className="text-xs text-parchment/45">Requested {formatDate(member.createdAt)}</p>
                </div>
                <button
                  type="button"
                  className="adwa-btn-primary px-4 py-2 text-sm disabled:opacity-60"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => apiRequest(`/api/admin/staff/users/${member.id}/approve`, { method: "POST" }),
                      `${member.displayName} approved.`
                    )
                  }
                >
                  Approve
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Staff directory">
        {staff.length === 0 ? (
          <p className="text-sm text-parchment/60">No staff accounts yet.</p>
        ) : (
          <ul className="space-y-2">
            {staff.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 rounded-xl2 border border-wanza-wood p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{member.displayName}</p>
                  <p className="truncate text-xs text-parchment/60">{member.email}</p>
                  <p className="text-xs text-parchment/45">
                    {member.roles.join(", ")} · {member.status}
                    {member.lastSignInAt ? ` · last seen ${formatDate(member.lastSignInAt)}` : ""}
                  </p>
                </div>
                {member.status !== "suspended" && (
                  <button
                    type="button"
                    className="adwa-btn-secondary border-adwa-crimson px-4 py-2 text-sm text-adwa-crimson disabled:opacity-60"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => apiRequest(`/api/admin/staff/users/${member.id}/suspend`, { method: "POST" }),
                        `${member.displayName} suspended.`
                      )
                    }
                  >
                    Suspend
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Recent administrative activity">
        {logs.length === 0 ? (
          <p className="text-sm text-parchment/60">No administrative actions recorded yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {logs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-baseline gap-x-2 border-b border-wanza-wood/50 py-1.5">
                <span className="font-mono text-xs text-imperial-gold">{log.action}</span>
                <span className="text-parchment/70">{log.resource}</span>
                <span className="ml-auto text-xs text-parchment/45">
                  {log.actor} · {new Date(log.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminShell>
  );
}
