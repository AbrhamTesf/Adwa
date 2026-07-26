import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeEmail, prisma } from "../lib/prisma.js";
import { hashPassword, validatePasswordStrength } from "../lib/password.js";
import { sanitizeExhibitContent } from "../lib/contentSchema.js";

const EXHIBIT_SOURCE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../frontend/public/exhibits"
);

const ROLES = [
  { name: "tourist", description: "Museum visitor with a personal tour history." },
  { name: "admin_staff", description: "Museum staff with CMS and analytics access." },
  { name: "super_admin", description: "Operator who can approve staff and assign roles." }
];

// Mirrors the badge catalogue the visitor experience already unlocks client-side.
const BADGES = [
  { code: "first_scan", name: "First Light", description: "Scanned your first exhibit." },
  { code: "shotel_master", name: "Shotel Bearer", description: "Inspected the shotel sword in depth." },
  { code: "drum_caller", name: "Drum Caller", description: "Played the negarit drum." },
  { code: "breath_of_adwa", name: "Breath of Adwa", description: "Sounded the embilta or meleket." },
  { code: "quiz_victor", name: "Quiz Victor", description: "Answered every quiz question correctly." },
  { code: "full_circuit", name: "Full Circuit", description: "Completed an entire tour itinerary." }
];

async function seedRoles() {
  for (const role of ROLES) {
    await prisma.role.upsert({ where: { name: role.name }, update: { description: role.description }, create: role });
  }
  return ROLES.length;
}

async function seedBadges() {
  for (const badge of BADGES) {
    await prisma.badge.upsert({ where: { code: badge.code }, update: { name: badge.name, description: badge.description }, create: badge });
  }
  return BADGES.length;
}

/**
 * Only runs when both the bootstrap email and password are configured, so a
 * clean environment never gets a predictable privileged account by default.
 */
async function seedBootstrapAdmin() {
  const email = normalizeEmail(process.env.BOOTSTRAP_ADMIN_EMAIL || "");
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || "";
  if (!email || !password) return null;

  const problem = validatePasswordStrength(password);
  if (problem) throw new Error(`BOOTSTRAP_ADMIN_PASSWORD rejected: ${problem}`);

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return email;

  const roles = await prisma.role.findMany({ where: { name: { in: ["admin_staff", "super_admin"] } } });
  await prisma.user.create({
    data: {
      email,
      displayName: process.env.BOOTSTRAP_ADMIN_NAME || "Museum Administrator",
      passwordHash: await hashPassword(password),
      status: "active",
      roles: { create: roles.map((role) => ({ roleId: role.id })) }
    }
  });
  return email;
}

/**
 * Imports the static exhibit JSON as published version 1 so the CMS opens with
 * the live catalogue already in it. Existing records are left alone — staff
 * edits must never be overwritten by a re-seed.
 */
async function seedContentFromStaticExhibits() {
  let files;
  try {
    files = (await readdir(EXHIBIT_SOURCE_DIR)).filter((file) => file.endsWith(".json"));
  } catch {
    console.warn(`No exhibit source directory at ${EXHIBIT_SOURCE_DIR}; skipping content import.`);
    return 0;
  }

  let imported = 0;
  for (const file of files) {
    const raw = JSON.parse(await readFile(path.join(EXHIBIT_SOURCE_DIR, file), "utf8"));
    const exhibitId = raw.exhibit_id || path.basename(file, ".json");

    if (await prisma.contentItem.findUnique({ where: { exhibitId }, select: { id: true } })) continue;

    const content = sanitizeExhibitContent(raw, exhibitId);
    const item = await prisma.contentItem.create({
      data: { exhibitId, draft: content, published: content, status: "published", version: 1 }
    });
    await prisma.contentVersion.create({
      data: { contentItemId: item.id, version: 1, content }
    });
    imported += 1;
  }
  return imported;
}

async function main() {
  const roleCount = await seedRoles();
  const badgeCount = await seedBadges();
  const contentCount = await seedContentFromStaticExhibits();
  const admin = await seedBootstrapAdmin();

  console.log(`Seeded ${roleCount} roles and ${badgeCount} badges.`);
  console.log(
    contentCount > 0
      ? `Imported ${contentCount} exhibits into the CMS as published version 1.`
      : "CMS content already present; no exhibits imported."
  );
  console.log(
    admin
      ? `Bootstrap admin ready: ${admin}`
      : "No bootstrap admin created (set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to create one)."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
