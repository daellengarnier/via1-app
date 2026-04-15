import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SeedEntry {
  title: string;
  category: string;
  content: string;
}

const SEED_ENTRIES: SeedEntry[] = [
  {
    title: "Biodiversität",
    category: "Garten",
    content:
      "Informationen zur Biodiversität rund ums Haus: einheimische Pflanzen, Insektenhotels, Nistkästen, Kompost und wie wir den Lebensraum für Tiere und Pflanzen fördern.\n\n(noch zu vervollständigen)",
  },
  {
    title: "Spinnerei",
    category: "Umgebung",
    content:
      "Die Kulturspinnerei ist unser kulturelles Nachbargebäude mit Veranstaltungen, Soirées und Tanzabenden. Infos zu Programm, Öffnungszeiten und wie wir als Hausgemeinschaft mit der Spinnerei vernetzt sind.\n\n(noch zu vervollständigen)",
  },
  {
    title: "Hauskiosk",
    category: "Alltag",
    content:
      "Der Hauskiosk versorgt uns mit den wichtigsten Dingen des Alltags: Sortiment, Öffnungszeiten, Abrechnung und wie Nachbestellungen funktionieren.\n\n(noch zu vervollständigen)",
  },
  {
    title: "Recycling",
    category: "Alltag",
    content:
      "Wie wir im Haus recyclen: Glas, Papier/Karton, Alu/Blech, PET, Batterien, Elektro, Bio/Kompost, Restmüll. Wo die Behälter stehen, wann abgeholt wird und wer wofür zuständig ist.\n\n(noch zu vervollständigen)",
  },
  {
    title: "Haltungspapier",
    category: "Regeln",
    content:
      "Unsere gemeinsamen Werte, Umgangsformen und Hausregeln. Das Haltungspapier ist die Grundlage für unser Zusammenleben.\n\n(noch zu vervollständigen)",
  },
  {
    title: "Geschichte des Hauses",
    category: "Haus",
    content:
      "Die Geschichte des Via 1: Vom Neubau über die ersten Bewohner:innen bis heute. Wichtige Ereignisse, Meilensteine und Anekdoten.\n\n(noch zu vervollständigen)",
  },
  {
    title: "Architektur des Hauses",
    category: "Haus",
    content:
      "Die architektonischen Besonderheiten: dreieckige Grundform, Holzbau, Glaspyramide/Wintergarten, Splitlevel zwischen Nord- und Ost-Flügel, Materialien und Konzept.\n\n(noch zu vervollständigen)",
  },
  {
    title: "Pyramidstage",
    category: "Gemeinschaftsräume",
    content:
      "Die Pyramidstage unter der Glaspyramide: Bühne, Technik, Nutzung für Konzerte, Vorträge und Veranstaltungen. Reservation und Regeln.\n\n(noch zu vervollständigen)",
  },
  {
    title: "Garten",
    category: "Garten",
    content:
      "Gemeinschaftsgarten: Beete, Werkzeuge, Giessplan, Ernte und wer welche Bereiche pflegt. Gemeinsame Aktionen wie Gartentage.\n\n(noch zu vervollständigen)",
  },
  {
    title: "Abwartsdienst",
    category: "Organisation",
    content:
      "Der Abwartsdienst kümmert sich um Unterhalt, Reparaturen und allgemeine Hauspflege. Ansprechpersonen, Zuständigkeiten und wie Meldungen abgegeben werden.\n\n(noch zu vervollständigen)",
  },
  {
    title: "Biotop",
    category: "Garten",
    content:
      "Unser Biotop: Lage, Bepflanzung, Wassertiere/Insekten und wie wir es pflegen. Beobachtungen und Jahreszyklen.\n\n(noch zu vervollständigen)",
  },
  {
    title: "Gemeinschaftsladen",
    category: "Alltag",
    content:
      "Der Gemeinschaftsladen: Sortiment, Bezahlsystem, Schichten, Nachbestellungen und wie neue Produkte ins Sortiment aufgenommen werden.\n\n(noch zu vervollständigen)",
  },
  {
    title: "Wohnbaugenossenschaft Via Felsenau",
    category: "Organisation",
    content:
      "Die Genossenschaft als Trägerin des Hauses: Statuten, Vorstand, Generalversammlung, Anteilscheine und wie die Mitwirkung als Genossenschafter:in funktioniert.\n\n(noch zu vervollständigen)",
  },
  {
    title: "Organisation Via 1",
    category: "Organisation",
    content:
      "Wie das Via 1 organisiert ist: Sitzungen, Arbeitsgruppen, Entscheidungsfindung, Protokolle und Rollen im Haus.\n\n(noch zu vervollständigen)",
  },
  {
    title: "Ämtlis",
    category: "Alltag",
    content:
      "Die Ämtlis im Haus: Aufgaben, Rotation, Zuständigkeiten und wie der Ämtliplan funktioniert.\n\n(noch zu vervollständigen)",
  },
];

// POST /api/admin/hausbuch-seed — legt die Basis-Hausbuch-Eintraege an
// (idempotent: erstellt nur was noch nicht existiert)
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(session.user.roles || []).includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.hausbuchArticle.findMany({
    select: { title: true },
  });
  const existingTitles = new Set(existing.map((e) => e.title));

  let created = 0;
  let skipped = 0;

  for (const entry of SEED_ENTRIES) {
    if (existingTitles.has(entry.title)) {
      skipped++;
      continue;
    }
    await prisma.hausbuchArticle.create({
      data: {
        title: entry.title,
        content: entry.content,
        category: entry.category,
        owner: session.user.name ?? "",
        createdById: session.user.id,
        updatedById: session.user.id,
      },
    });
    created++;
  }

  return NextResponse.json({
    created,
    skipped,
    total: SEED_ENTRIES.length,
  });
}
