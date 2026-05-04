import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const ROOT = path.resolve(__dirname, "..");
const MD_PATH = path.join(ROOT, "docs", "notion-hausbuch-export-local-assets.md");

const placeTitles = new Set([
  "Parking",
  "Zufahrt & Vorplatz",
  "Eingang / Treppenhaus",
  "Wohnungen",
  "Saal / Spinnerei",
  "Pyramide",
  "Dach / Terrasse",
  "Waschküche",
  "Garten",
  "Sauna",
]);

const technicalTitles = new Set([
  "Brandschutz",
  "Elektroinstallation",
  "Sanitäre Installation",
  "Heizung",
]);

function categoryFor(title: string) {
  if (placeTitles.has(title)) return "Räume";
  if (technicalTitles.has(title)) return "Technik";
  if (["Gemeinschaft", "Mietwesen", "Genossenschaft"].includes(title)) return "Organisation";
  if (title.includes("Recycling") || title.includes("Entsorgung")) return "Alltag";
  return "Allgemein";
}

function typeFor(title: string) {
  if (placeTitles.has(title)) return "PLACE";
  if (technicalTitles.has(title)) return "GUIDE";
  if (title.includes("Recycling") || title.includes("Entsorgung")) return "GUIDE";
  return "INFO";
}

function sectionFor(title: string) {
  if (placeTitles.has(title)) return "Räume & Nutzung";
  if (technicalTitles.has(title)) return "Technik & Infrastruktur";
  if (["Gemeinschaft", "Mietwesen", "Genossenschaft"].includes(title)) return "Organisation & Mitwirkung";
  if (title.includes("Recycling") || title.includes("Entsorgung")) return "Alltag im Haus";
  return "Wissen";
}

function firstParagraph(content: string) {
  return content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/^#+\s+/gm, "").trim())
    .find(Boolean)
    ?.replace(/\s+/g, " ")
    .slice(0, 180) ?? "";
}

function imageToDataUrl(src: string) {
  const clean = src.replace(/^\.\//, "");
  const file = path.join(ROOT, "docs", clean.replace(/^notion-hausbuch-assets\//, "notion-hausbuch-assets/"));
  if (!fs.existsSync(file)) return null;
  const ext = path.extname(file).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/jpeg";
  return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
}

function extractArticles(md: string) {
  const lines = md.split(/\r?\n/);
  const articles: { title: string; content: string; images: { data: string; caption?: string | null; order: number }[] }[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      if (current) articles.push(build(current));
      current = { title: (h2[1] ?? "").trim(), lines: [] };
      continue;
    }
    if (!current) continue;
    current.lines.push(line);
  }
  if (current) articles.push(build(current));
  return articles.filter((a) => a.title && a.title !== "Company Home" && a.content.trim());
}

function build(raw: { title: string; lines: string[] }) {
  const images: { data: string; caption?: string | null; order: number }[] = [];
  const content = raw.lines
    .join("\n")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, caption, src) => {
      const data = imageToDataUrl(src);
      if (data) images.push({ data, caption: caption || null, order: images.length });
      return caption ? `[Bild: ${caption}]` : "[Bild]";
    })
    .trim();
  return { title: raw.title, content, images };
}

async function main() {
  if (!fs.existsSync(MD_PATH)) throw new Error(`Markdown export fehlt: ${MD_PATH}`);
  const user = await prisma.user.findFirst({
    where: { roles: { has: "ADMIN" } },
    orderBy: { createdAt: "asc" },
  });
  if (!user) throw new Error("Kein ADMIN-User gefunden; Import braucht updatedById/createdById.");

  const articles = extractArticles(fs.readFileSync(MD_PATH, "utf8"));
  let created = 0;
  let updated = 0;

  for (const entry of articles) {
    const existing = await prisma.hausbuchArticle.findFirst({ where: { title: entry.title } });
    const data = {
      title: entry.title,
      summary: firstParagraph(entry.content),
      content: entry.content,
      structured: { version: 1, intro: firstParagraph(entry.content), importedFrom: "Notion Wiki Via" },
      type: typeFor(entry.title),
      category: categoryFor(entry.title),
      section: sectionFor(entry.title),
      tags: ["Notion-Import", categoryFor(entry.title)].filter(Boolean),
      status: "PUBLISHED",
      owner: user.name,
      updatedById: user.id,
    };
    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.hausbuchImage.deleteMany({ where: { articleId: existing.id } });
        await tx.hausbuchArticle.update({
          where: { id: existing.id },
          data: { ...data, images: { create: entry.images } },
        });
      });
      updated++;
    } else {
      await prisma.hausbuchArticle.create({
        data: { ...data, createdById: user.id, images: { create: entry.images } },
      });
      created++;
    }
  }

  // Ein paar sinnvolle interne Links setzen.
  const all = await prisma.hausbuchArticle.findMany({ select: { id: true, title: true } });
  const byTitle = new Map(all.map((a) => [a.title, a.id]));
  const pairs: [string, string][] = [
    ["Waschküche", "Entsorgung & Recycling"],
    ["Saal / Spinnerei", "Brandschutz"],
    ["Pyramide", "Brandschutz"],
    ["Sauna", "Brandschutz"],
    ["Garten", "Entsorgung & Recycling"],
    ["Wohnungen", "Mietwesen"],
  ];
  for (const [from, to] of pairs) {
    const fromId = byTitle.get(from);
    const toId = byTitle.get(to);
    if (fromId && toId) {
      await prisma.hausbuchArticleLink.upsert({
        where: { fromId_toId: { fromId, toId } },
        update: { label: "siehe auch" },
        create: { fromId, toId, label: "siehe auch" },
      });
    }
  }

  console.log(`Hausbuch-Wiki importiert: ${created} erstellt, ${updated} aktualisiert, ${articles.length} total.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
