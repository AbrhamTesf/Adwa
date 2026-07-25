import React, { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/apiClient";
import AdminShell, { Panel, StatusNote } from "./AdminShell.jsx";

const SCRIPT_FIELDS = [
  { key: "material", label: "Material story" },
  { key: "craft", label: "Craft story" },
  { key: "usage", label: "Usage story" }
];

const EMPTY_DRAFT = {
  exhibit_id: "",
  name: "",
  category: "",
  glb_url: "",
  hotspot_json: {},
  persona_scripts: {},
  audio_profile: {}
};

/** Staff CMS: edit exhibit copy, publish a version, roll back to an earlier one. */
export default function ContentManager({ navigate }) {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [advancedJson, setAdvancedJson] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    try {
      const data = await apiRequest("/api/admin/content");
      setItems(data.items);
      setSelectedId((current) => current || data.items[0]?.exhibitId || null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadDetail = useCallback(async (exhibitId) => {
    if (!exhibitId) return;
    try {
      const data = await apiRequest(`/api/admin/content/${exhibitId}`);
      const working = data.draft || data.published || { ...EMPTY_DRAFT, exhibit_id: exhibitId };
      setDetail(data);
      setDraft(working);
      setAdvancedJson(
        JSON.stringify(
          { hotspot_json: working.hotspot_json || {}, audio_profile: working.audio_profile || {} },
          null,
          2
        )
      );
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  /**
   * Merges the structured fields with the advanced JSON block. Invalid JSON is
   * reported here rather than sent, so staff get an immediate answer.
   */
  function collectContent() {
    let advanced = { hotspot_json: draft.hotspot_json, audio_profile: draft.audio_profile };
    if (showAdvanced) {
      try {
        const parsed = JSON.parse(advancedJson);
        advanced = {
          hotspot_json: parsed.hotspot_json ?? {},
          audio_profile: parsed.audio_profile ?? {}
        };
      } catch {
        throw new Error("The hotspots and audio JSON is not valid JSON.");
      }
    }
    return { ...draft, ...advanced, exhibit_id: selectedId };
  }

  async function run(action, successMessage) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(successMessage);
      await Promise.all([loadList(), loadDetail(selectedId)]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const saveDraft = () =>
    run(
      () =>
        apiRequest(`/api/admin/content/${selectedId}/draft`, {
          method: "PUT",
          body: { content: collectContent() }
        }),
      "Draft saved. Visitors still see the published version."
    );

  const publish = () =>
    run(async () => {
      await apiRequest(`/api/admin/content/${selectedId}/draft`, {
        method: "PUT",
        body: { content: collectContent() }
      });
      await apiRequest(`/api/admin/content/${selectedId}/publish`, { method: "POST" });
    }, "Published. Visitors now see this version.");

  const rollback = (version) =>
    run(
      () =>
        apiRequest(`/api/admin/content/${selectedId}/rollback`, {
          method: "POST",
          body: { version }
        }),
      `Rolled back to version ${version} and republished.`
    );

  return (
    <AdminShell
      title="Content management"
      subtitle="Edit exhibit copy and persona stories, publish versions, and roll back changes."
      navigate={navigate}
    >
      <Panel title="Exhibits">
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item.exhibitId}
              type="button"
              className="adwa-chip"
              data-active={item.exhibitId === selectedId}
              onClick={() => setSelectedId(item.exhibitId)}
            >
              {item.exhibitId}
              <span className="ml-2 text-xs text-parchment/50">v{item.version}</span>
            </button>
          ))}
          {items.length === 0 && <p className="text-sm text-parchment/60">No exhibits in the CMS yet.</p>}
        </div>
      </Panel>

      {detail && (
        <>
          <Panel
            title={`Editing ${selectedId}`}
            action={
              <span className="text-xs uppercase tracking-[0.14em] text-parchment/50">
                {detail.item.status} · v{detail.item.version}
              </span>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Display name"
                value={draft.name || ""}
                onChange={(value) => setDraft({ ...draft, name: value })}
              />
              <TextField
                label="Category"
                value={draft.category || ""}
                onChange={(value) => setDraft({ ...draft, category: value })}
              />
            </div>
            <TextField
              label="3D model path"
              value={draft.glb_url || ""}
              onChange={(value) => setDraft({ ...draft, glb_url: value })}
            />

            {SCRIPT_FIELDS.map((field) => (
              <div key={field.key} className="mt-3">
                <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-parchment/60">
                  {field.label}
                </label>
                <textarea
                  rows={3}
                  value={draft.persona_scripts?.[field.key] || ""}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      persona_scripts: { ...draft.persona_scripts, [field.key]: event.target.value }
                    })
                  }
                  className="w-full rounded-xl2 border border-wanza-wood bg-obsidian-raised px-3 py-2 text-sm text-parchment outline-none focus:border-imperial-gold"
                />
              </div>
            ))}

            <button
              type="button"
              className="mt-3 text-xs uppercase tracking-[0.14em] text-imperial-gold"
              onClick={() => setShowAdvanced((open) => !open)}
            >
              {showAdvanced ? "Hide" : "Edit"} hotspots &amp; audio JSON
            </button>
            {showAdvanced && (
              <textarea
                rows={12}
                value={advancedJson}
                onChange={(event) => setAdvancedJson(event.target.value)}
                spellCheck={false}
                className="mt-2 w-full rounded-xl2 border border-wanza-wood bg-obsidian px-3 py-2 font-mono text-xs text-parchment outline-none focus:border-imperial-gold"
              />
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className="adwa-btn-secondary disabled:opacity-60" disabled={busy} onClick={saveDraft}>
                Save draft
              </button>
              <button type="button" className="adwa-btn-primary disabled:opacity-60" disabled={busy} onClick={publish}>
                Publish
              </button>
            </div>

            <StatusNote tone="error">{error}</StatusNote>
            <StatusNote>{notice}</StatusNote>
          </Panel>

          <Panel title="Version history">
            {detail.versions.length === 0 ? (
              <p className="text-sm text-parchment/60">Nothing published yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {detail.versions.map((version) => (
                  <li key={version.id} className="flex items-center justify-between gap-3 border-b border-wanza-wood/50 py-1.5">
                    <span>
                      <span className="font-mono text-xs text-imperial-gold">v{version.version}</span>
                      <span className="ml-2 text-parchment/60">
                        {new Date(version.publishedAt).toLocaleString()}
                      </span>
                    </span>
                    {version.version !== detail.item.version && (
                      <button
                        type="button"
                        className="text-xs uppercase tracking-[0.14em] text-imperial-gold disabled:opacity-50"
                        disabled={busy}
                        onClick={() => rollback(version.version)}
                      >
                        Roll back
                      </button>
                    )}
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

function TextField({ label, value, onChange }) {
  return (
    <div className="mt-3">
      <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-parchment/60">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl2 border border-wanza-wood bg-obsidian-raised px-3 py-2 text-sm text-parchment outline-none focus:border-imperial-gold"
      />
    </div>
  );
}
