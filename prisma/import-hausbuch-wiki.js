/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const ROOT = path.resolve(__dirname, "..");
const MD_PATH = path.join(ROOT, "docs", "notion-hausbuch-export-local-assets.md");
const RECORDMAP_PATH = path.join(ROOT, "docs", "notion-hausbuch-recordmap.json");

const placeTitles = new Set(["Parking", "Zufahrt & Vorplatz", "Eingang / Treppenhaus", "Wohnungen", "Saal / Spinnerei", "Pyramide", "Dach / Terrasse", "Waschküche", "Garten", "Sauna", "EG Nord", "EG Ost", "1. OG Nord", "1. OG Ost", "2. OG Nord", "2. OG Ost"]);
const technicalTitles = new Set(["Brandschutz", "Brandmeldeanlage (BMA)", "Elektroinstallation", "Sanitäre Installation", "Heizung", "Lüftung"]);

function categoryFor(title) {
  if (placeTitles.has(title)) return "Räume";
  if (technicalTitles.has(title)) return "Technik";
  if (["Gemeinschaft", "Mietwesen", "Genossenschaft"].includes(title)) return "Organisation";
  if (title.includes("Recycling") || title.includes("Entsorgung")) return "Alltag";
  return "Allgemein";
}
function typeFor(title) {
  if (placeTitles.has(title)) return "PLACE";
  if (technicalTitles.has(title)) return "GUIDE";
  if (title.includes("Recycling") || title.includes("Entsorgung")) return "GUIDE";
  return "INFO";
}
function sectionFor(title) {
  if (placeTitles.has(title)) return "Räume & Nutzung";
  if (technicalTitles.has(title)) return "Technik & Infrastruktur";
  if (["Gemeinschaft", "Mietwesen", "Genossenschaft"].includes(title)) return "Organisation & Mitwirkung";
  if (title.includes("Recycling") || title.includes("Entsorgung")) return "Alltag im Haus";
  return "Wissen";
}
function firstParagraph(content) {
  const found = content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/^#+\s+/gm, "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/^[-*]\s+/gm, "").trim())
    .find(Boolean);
  return (found || "").replace(/\s+/g, " ").slice(0, 180);
}
function imageToDataUrl(src) {
  const clean = src.replace(/^\.\//, "");
  const file = path.join(ROOT, "docs", clean.replace(/^notion-hausbuch-assets\//, "notion-hausbuch-assets/"));
  if (!fs.existsSync(file)) return null;
  const ext = path.extname(file).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/jpeg";
  return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
}
function plainTitle(prop) {
  return (prop || []).map((x) => x[0] || "").join("").trim();
}
function loadPageMeta() {
  const pageTitles = new Set();
  const titleById = new Map();
  const parentByTitle = new Map();
  const childrenByTitle = new Map();
  if (!fs.existsSync(RECORDMAP_PATH)) return { pageTitles, parentByTitle, childrenByTitle };
  const recordMap = JSON.parse(fs.readFileSync(RECORDMAP_PATH, "utf8")).recordMap;
  const blocks = recordMap.block || {};
  for (const block of Object.values(blocks)) {
    const value = block?.value?.value;
    if (value?.type === "page") {
      const title = plainTitle(value.properties?.title);
      if (title) {
        pageTitles.add(title);
        titleById.set(value.id, title);
      }
    }
  }
  for (const block of Object.values(blocks)) {
    const value = block?.value?.value;
    if (value?.type === "page") {
      const title = plainTitle(value.properties?.title);
      const parent = titleById.get(value.parent_id);
      if (title && parent) {
        parentByTitle.set(title, parent);
        if (!childrenByTitle.has(parent)) childrenByTitle.set(parent, []);
        childrenByTitle.get(parent).push(title);
      }
    }
  }
  return { pageTitles, parentByTitle, childrenByTitle };
}
function normalizeContent(title, lines, children) {
  const images = [];
  let content = lines
    .join("\n")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, caption, src) => {
      const data = imageToDataUrl(src);
      if (data) images.push({ data, caption: caption || null, order: images.length });
      return caption ? `[Bild: ${caption}]` : "[Bild]";
    })
    .split(/\r?\n/)
    .filter((line) => line.trim() !== title)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (content.length < 20 && children.length) {
    content = `Dieser Bereich enthält Untereinträge:\n\n${children.map((child) => `- ${child}`).join("\n")}`;
  }
  if (!content) content = "Noch leer im Notion-Wiki.";
  return { title, content, images };
}
function extractArticles(md) {
  const { pageTitles, parentByTitle, childrenByTitle } = loadPageMeta();
  const lines = md.split(/\r?\n/);
  const headings = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
    if (match) headings.push({ index: i, level: match[1].length, title: match[2].trim() });
  }
  const articles = [];
  for (let h = 0; h < headings.length; h++) {
    const heading = headings[h];
    if (!pageTitles.has(heading.title)) continue;
    const expectedLevel = parentByTitle.has(heading.title) ? 3 : 2;
    if (heading.level !== expectedLevel) continue;
    let end = lines.length;
    for (let n = h + 1; n < headings.length; n++) {
      const next = headings[n];
      if (next.level <= heading.level || pageTitles.has(next.title)) {
        end = next.index;
        break;
      }
    }
    const children = childrenByTitle.get(heading.title) || [];
    const article = normalizeContent(heading.title, lines.slice(heading.index + 1, end), children);
    article.parentTitle = parentByTitle.get(heading.title) || null;
    article.childTitles = children;
    articles.push(article);
  }
  return articles.filter((a) => a.title && a.title !== "Company Home");
}

async function main() {
  if (!fs.existsSync(MD_PATH)) throw new Error(`Markdown export fehlt: ${MD_PATH}`);
  const user = await prisma.user.findFirst({ where: { name: "Yves" } }) || await prisma.user.findFirst({ where: { roles: { has: "ADMIN" } }, orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("Kein Yves/Admin-User gefunden; Import braucht updatedById/createdById.");

  const articles = extractArticles(fs.readFileSync(MD_PATH, "utf8"));
  let created = 0;
  let updated = 0;

  for (const entry of articles) {
    const existing = await prisma.hausbuchArticle.findFirst({ where: { title: entry.title } });
    const data = {
      title: entry.title,
      summary: firstParagraph(entry.content),
      content: entry.content,
      structured: { version: 2, intro: firstParagraph(entry.content), importedFrom: "Notion Wiki Via", parentTitle: entry.parentTitle, childTitles: entry.childTitles },
      type: typeFor(entry.title),
      category: categoryFor(entry.title),
      section: sectionFor(entry.title),
      tags: ["Notion-Import", categoryFor(entry.title), entry.parentTitle ? `Unterseite: ${entry.parentTitle}` : "Hauptseite"].filter(Boolean),
      status: "PUBLISHED",
      owner: user.name,
      updatedById: user.id,
    };
    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.hausbuchImage.deleteMany({ where: { articleId: existing.id } });
        await tx.hausbuchArticle.update({ where: { id: existing.id }, data: { ...data, images: { create: entry.images } } });
      });
      updated++;
    } else {
      await prisma.hausbuchArticle.create({ data: { ...data, createdById: user.id, images: { create: entry.images } } });
      created++;
    }
  }

  const all = await prisma.hausbuchArticle.findMany({ select: { id: true, title: true } });
  const byTitle = new Map(all.map((a) => [a.title, a.id]));
  const pairs = [
    ["Waschküche", "Entsorgung & Recycling"], ["Saal / Spinnerei", "Brandschutz"], ["Saal / Spinnerei", "Lüftung"],
    ["Brandschutz", "Brandmeldeanlage (BMA)"], ["Pyramide", "Brandschutz"], ["Sauna", "Brandschutz"],
    ["Garten", "Entsorgung & Recycling"], ["Wohnungen", "Mietwesen"],
    ...articles.filter((a) => a.parentTitle).map((a) => [a.parentTitle, a.title]),
  ];
  for (const [from, to] of pairs) {
    const fromId = byTitle.get(from);
    const toId = byTitle.get(to);
    if (fromId && toId && fromId !== toId) {
      await prisma.hausbuchArticleLink.upsert({ where: { fromId_toId: { fromId, toId } }, update: { label: "siehe auch" }, create: { fromId, toId, label: "siehe auch" } });
    }
  }
  console.log(`Hausbuch-Wiki importiert: ${created} erstellt, ${updated} aktualisiert, ${articles.length} total.`);
}

main().catch((err) => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
