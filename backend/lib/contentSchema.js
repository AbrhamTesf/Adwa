/**
 * Validation for CMS exhibit records. Staff-authored JSON is served straight
 * to the visitor app, so everything is rebuilt field by field rather than
 * spread — an unexpected key must never survive into published content.
 */

const HOTSPOT_TABS = new Set(["material", "craft", "usage"]);
const SCRIPT_KEYS = ["material", "craft", "usage"];
const MAX_HOTSPOTS = 12;
const MAX_AUDIO_ENTRIES = 8;

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.provider = "content";
  return error;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireString(value, field, { max = 240, min = 1 } = {}) {
  if (typeof value !== "string") throw httpError(400, `"${field}" must be text.`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw httpError(400, `"${field}" is required.`);
  if (trimmed.length > max) throw httpError(400, `"${field}" must be under ${max} characters.`);
  return trimmed;
}

/** Blocks javascript: and data: URLs from reaching a src/href in the client. */
function requireAssetPath(value, field) {
  const path = requireString(value, field, { max: 400 });
  if (!/^(\/|https:\/\/)/.test(path)) {
    throw httpError(400, `"${field}" must be a site-relative path or an https URL.`);
  }
  return path;
}

/** model-viewer expects three space-separated numbers, e.g. "-0.18 0.48 -0.01". */
function requireVector(value, field) {
  const vector = requireString(value, field, { max: 80 });
  const parts = vector.split(/\s+/);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(Number(part)))) {
    throw httpError(400, `"${field}" must be three space-separated numbers.`);
  }
  return parts.join(" ");
}

function sanitizeHotspots(value) {
  if (!isPlainObject(value)) throw httpError(400, "Hotspots must be an object.");

  const entries = Object.entries(value);
  if (entries.length > MAX_HOTSPOTS) {
    throw httpError(400, `An exhibit can have at most ${MAX_HOTSPOTS} hotspots.`);
  }

  const hotspots = {};
  for (const [key, hotspot] of entries) {
    const id = requireString(key, "hotspot id", { max: 40 });
    if (!isPlainObject(hotspot)) throw httpError(400, `Hotspot "${id}" must be an object.`);

    const tab = requireString(hotspot.tab, `hotspot.${id}.tab`, { max: 20 });
    if (!HOTSPOT_TABS.has(tab)) {
      throw httpError(400, `Hotspot "${id}" tab must be one of: ${[...HOTSPOT_TABS].join(", ")}.`);
    }

    hotspots[id] = {
      position: requireVector(hotspot.position, `hotspot.${id}.position`),
      normal: requireVector(hotspot.normal, `hotspot.${id}.normal`),
      tab,
      label: requireString(hotspot.label, `hotspot.${id}.label`, { max: 80 })
    };
  }
  return hotspots;
}

function sanitizePersonaScripts(value) {
  if (!isPlainObject(value)) throw httpError(400, "Persona scripts must be an object.");

  const scripts = {};
  for (const key of SCRIPT_KEYS) {
    if (value[key] === undefined || value[key] === "") continue;
    scripts[key] = requireString(value[key], `persona_scripts.${key}`, { max: 2000 });
  }
  if (Object.keys(scripts).length === 0) {
    throw httpError(400, "At least one persona script is required.");
  }
  return scripts;
}

/** Keys vary per exhibit (ambient, clash_sfx, tone_sample…), values are paths. */
function sanitizeAudioProfile(value) {
  if (value === undefined || value === null) return {};
  if (!isPlainObject(value)) throw httpError(400, "Audio profile must be an object.");

  const entries = Object.entries(value);
  if (entries.length > MAX_AUDIO_ENTRIES) {
    throw httpError(400, `An exhibit can have at most ${MAX_AUDIO_ENTRIES} audio entries.`);
  }

  const audio = {};
  for (const [key, path] of entries) {
    const id = requireString(key, "audio key", { max: 40 });
    audio[id] = requireAssetPath(path, `audio_profile.${id}`);
  }
  return audio;
}

/**
 * Returns a clean exhibit record, or throws an error carrying `status` so the
 * caller can hand it to normalizeError.
 */
export function sanitizeExhibitContent(input, expectedExhibitId) {
  if (!isPlainObject(input)) throw httpError(400, "Exhibit content is required.");

  const exhibitId = requireString(input.exhibit_id ?? expectedExhibitId, "exhibit_id", { max: 60 });
  if (expectedExhibitId && exhibitId !== expectedExhibitId) {
    throw httpError(400, "The exhibit_id in the content does not match the exhibit being edited.");
  }
  if (!/^[a-z0-9_]+$/.test(exhibitId)) {
    throw httpError(400, "exhibit_id may only contain lowercase letters, numbers and underscores.");
  }

  return {
    exhibit_id: exhibitId,
    name: requireString(input.name, "name", { max: 120 }),
    category: requireString(input.category, "category", { max: 40 }),
    glb_url: requireAssetPath(input.glb_url, "glb_url"),
    hotspot_json: sanitizeHotspots(input.hotspot_json),
    persona_scripts: sanitizePersonaScripts(input.persona_scripts),
    audio_profile: sanitizeAudioProfile(input.audio_profile)
  };
}
