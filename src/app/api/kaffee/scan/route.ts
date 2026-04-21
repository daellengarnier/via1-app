import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/kaffee/scan — nimmt ein Base64-Bild einer Kaffee-Etikette
// und extrahiert Name, Herkunft, Duftnoten, Fairtrade via Claude Vision.
//
// Body: { image: "data:image/jpeg;base64,..." }
// Response: { name, herkunft, duftnotizen, fairtrade }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Claude API nicht konfiguriert (ANTHROPIC_API_KEY fehlt). Bitte manuell erfassen.",
      },
      { status: 503 }
    );
  }

  const body = (await req.json()) as { image?: unknown };
  const image = typeof body.image === "string" ? body.image : "";
  // data:image/jpeg;base64,XXX  →  XXX  + Media-Type ermitteln
  const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json(
      { error: "Ungültiges Bildformat" },
      { status: 400 }
    );
  }
  const mediaType = match[1]!;
  const base64 = match[2]!;

  // Safety: Limit 4 MB base64 (~3 MB binary)
  if (base64.length > 4 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Bild zu gross (max ~3 MB)" },
      { status: 400 }
    );
  }

  const systemPrompt = `Du extrahierst strukturierte Daten aus Fotos von Kaffee-Etiketten, meistens von Rast Kaffee (Ebikon). Antworte IMMER nur mit einem JSON-Objekt, keine Erklärung davor oder danach.

Felder:
- "name": Produktname (String). Kurz und prägnant, ohne "Kaffee" oder "Espresso" als Prefix ausser es ist Teil des Namens.
- "herkunft": Herkunftsländer oder Bohnensorte (String, kommasepariert).
- "duftnotizen": Geschmacksprofil / Beschreibung (String, 3-10 Wörter).
- "fairtrade": Boolean, true wenn "Fairtrade", "Fair Trade", "Bio Fairtrade" oder gleichwertiges Label zu sehen ist.

Wenn ein Feld nicht ersichtlich ist: leerer String (für Strings) oder false (für Boolean). Antwort-Format:
{"name":"...","herkunft":"...","duftnotizen":"...","fairtrade":true}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: "text",
                text: "Extrahiere die Daten von dieser Kaffee-Etikette.",
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Claude API error", res.status, err);
      return NextResponse.json(
        { error: `Claude API Fehler (${res.status})` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    // JSON aus Response extrahieren (Claude koennte Markdown-Fences hinzufuegen)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Konnte keine Daten aus der Antwort lesen." },
        { status: 502 }
      );
    }
    const parsed = JSON.parse(jsonMatch[0]) as {
      name?: string;
      herkunft?: string;
      duftnotizen?: string;
      fairtrade?: boolean;
    };

    return NextResponse.json({
      name: typeof parsed.name === "string" ? parsed.name : "",
      herkunft: typeof parsed.herkunft === "string" ? parsed.herkunft : "",
      duftnotizen:
        typeof parsed.duftnotizen === "string" ? parsed.duftnotizen : "",
      fairtrade: parsed.fairtrade === true,
    });
  } catch (err) {
    console.error("Kaffee-Scan", err);
    return NextResponse.json(
      { error: "Scan fehlgeschlagen." },
      { status: 500 }
    );
  }
}
