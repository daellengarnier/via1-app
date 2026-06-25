// Rast-Sortiment fuer die Kaffee-Seite.
//
// Quelle: rastshop.ch (WooCommerce). Da das Sortiment selten aendert,
// cachen wir den Scrape 7 Tage. Bei Scrape-Fehler greift das hard-
// kodierte FALLBACK_RAST_SORTIMENT — so bleibt die Liste auch ohne
// Internet stabil und entspricht dem Stand der letzten manuellen
// Pflege.

export interface RastKaffee {
  name: string;
  herkunft: string;
  duftnotizen: string;
  fairtrade: boolean;
}

// Manuell gepflegter Fallback nach rastshop.ch (Stand 06/2026).
export const FALLBACK_RAST_SORTIMENT: RastKaffee[] = [
  // Italienische Espresso-Blends
  { name: "Milano", herkunft: "Guatemala, Costa Rica, Brasilien, Java", duftnotizen: "Kräftig, schokoladig, voller Körper", fairtrade: false },
  { name: "Napoli", herkunft: "Indonesien, Brasilien, Guatemala", duftnotizen: "Dunkel geröstet, intensiv, kräftige Crema", fairtrade: false },
  { name: "Vesuvio", herkunft: "Brasilien, Guatemala, Indonesien", duftnotizen: "Bittermandel, Schokolade", fairtrade: false },
  { name: "Torino", herkunft: "Brasilien, Guatemala, Costa Rica", duftnotizen: "Rund, harmonisch, leichte Schokoladennote", fairtrade: false },
  { name: "Roma", herkunft: "Brasilien, Guatemala, Indien", duftnotizen: "Klassisch italienisch, kräftig, schokoladig", fairtrade: false },
  { name: "Sicilia", herkunft: "Brasilien, Indonesien, Indien", duftnotizen: "Dunkel, würzig, kräftiger Körper", fairtrade: false },
  { name: "Firenze", herkunft: "Brasilien, Guatemala, Costa Rica", duftnotizen: "Mittelkräftig, nussig, fein", fairtrade: false },
  { name: "Verona", herkunft: "Brasilien, Kolumbien, Guatemala", duftnotizen: "Ausgewogen, mild, süsslich", fairtrade: false },
  { name: "Genova", herkunft: "Brasilien, Kolumbien, Indien", duftnotizen: "Mild, nussig, wenig Säure", fairtrade: false },

  // Bio / Fairtrade Blends
  { name: "Bologna Bio Fairtrade", herkunft: "Bio Arabica Blend", duftnotizen: "Klassisch italienisch, modern & frisch", fairtrade: true },
  { name: "Como Bio Fairtrade", herkunft: "Bio Arabica", duftnotizen: "Bittermandel, Schokolade, feine Zitrusnote", fairtrade: true },
  { name: "Bio Espresso", herkunft: "Brasilien, Indonesien (Bio)", duftnotizen: "Beeren, dunkle Nussschokolade", fairtrade: true },
  { name: "Koffeinfrei Bio Fairtrade", herkunft: "Bio Arabica", duftnotizen: "Mild, rund, Schokolade", fairtrade: true },

  // Hausblends / spezielle
  { name: "Barista Espresso", herkunft: "Kenia, Guatemala, Indonesien, Indien, Brasilien", duftnotizen: "Komplex, intensiv, lange Crema", fairtrade: false },
  { name: "Eldorado", herkunft: "Indien, Guatemala, Brasilien, Costa Rica", duftnotizen: "Ausgewogen, süsslich, Karamell", fairtrade: false },
  { name: "Premium", herkunft: "Indonesien, Guatemala, Brasilien, Indien", duftnotizen: "Vollmundig, nussig, wenig Säure", fairtrade: false },
  { name: "Wiener", herkunft: "Guatemala, Costa Rica, Brasilien, Indonesien", duftnotizen: "Traditionell, weich, nussig", fairtrade: false },
  { name: "Festival", herkunft: "Kenia, Guatemala, Brasilien, Costa Rica", duftnotizen: "Fruchtig, lebendig, feine Säure", fairtrade: false },
  { name: "Jubiläums-Edition", herkunft: "Papua-Neuguinea, Costa Rica, Guatemala, Kolumbien, Brasilien", duftnotizen: "Komplex, festlich, ausgewogen", fairtrade: false },
  { name: "Home-Office", herkunft: "Blend", duftnotizen: "Mild, ausgewogen, für jede Tageszeit", fairtrade: false },
  { name: "Crema Italia", herkunft: "Brasilien, Indien, Guatemala", duftnotizen: "Cremig, ausgewogen, leichte Schokoladennote", fairtrade: false },

  // Länder-Kaffees (Single Origin)
  { name: "Yirga Cheffe Bio", herkunft: "Äthiopien (1500–2200m)", duftnotizen: "Jasmin, Bergamotte, Blumen", fairtrade: true },
  { name: "Guatemala Huehuetenango", herkunft: "Guatemala (Huehuetenango)", duftnotizen: "Zart, fruchtig, Kakao, feine Säure", fairtrade: false },
  { name: "Brasil Santos", herkunft: "Brasilien (Santos)", duftnotizen: "Nussig, mild, Karamell", fairtrade: false },
  { name: "Colombia Supremo", herkunft: "Kolumbien", duftnotizen: "Ausgewogen, fruchtig, würzig", fairtrade: false },
  { name: "Kenia AA", herkunft: "Kenia (Hochland)", duftnotizen: "Beerig, weinig, intensive Säure", fairtrade: false },
  { name: "Costa Rica Tarrazu", herkunft: "Costa Rica (Tarrazu)", duftnotizen: "Hell, zitrusfrisch, klare Süsse", fairtrade: false },
  { name: "Indonesia Mandheling", herkunft: "Indonesien (Sumatra)", duftnotizen: "Erdig, dunkel, wenig Säure", fairtrade: false },
  { name: "India Monsooned Malabar", herkunft: "Indien (Malabar)", duftnotizen: "Würzig, erdig, wenig Säure, voller Körper", fairtrade: false },
  { name: "APG Coatepec Veracruz", herkunft: "Mexiko (Coatepec, Veracruz)", duftnotizen: "Nussig, Karamell, milde Säure", fairtrade: false },
];

// WooCommerce Store-API liefert Produkte mit name + short_description.
// Wir nehmen alle Produkte aus den Kaffee-Kategorien — Pollen-Schluessel
// "kaffee" / "espresso" trifft bei rastshop.ch zu.
interface WcProduct {
  name?: string;
  short_description?: string;
  description?: string;
  categories?: { slug?: string }[];
}

const COFFEE_CATEGORY_HINTS = ["kaffee", "espresso", "bohnen", "coffee"];

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isCoffeeProduct(p: WcProduct): boolean {
  if (!p.categories || p.categories.length === 0) return true;
  return p.categories.some((c) =>
    COFFEE_CATEGORY_HINTS.some((hint) =>
      (c.slug ?? "").toLowerCase().includes(hint)
    )
  );
}

function mapWcProduct(p: WcProduct): RastKaffee | null {
  const name = (p.name ?? "").trim();
  if (!name) return null;
  const desc = stripHtml(p.short_description ?? p.description ?? "");
  const lowered = (name + " " + desc).toLowerCase();
  const fairtrade =
    lowered.includes("fairtrade") ||
    lowered.includes("fair trade") ||
    lowered.includes("bio ");
  // Heuristik: oft steht die Herkunft als erster Satz/Wortgruppe
  // ("Brasilien, Guatemala — fruchtig, süsslich"). Splitten auf
  // Bindestrich/Doppelpunkt. Wenn nicht ableitbar: Beschreibung
  // landet komplett in duftnotizen.
  const splitMatch = desc.match(/^([^—–\-:|]{3,80})[—–\-:|]\s*(.+)$/);
  const herkunft = splitMatch ? splitMatch[1]!.trim() : "";
  const duftnotizen = splitMatch ? splitMatch[2]!.trim() : desc;
  return { name, herkunft, duftnotizen, fairtrade };
}

// Live-Sortiment von rastshop.ch. Bei jedem Fehler oder leerer Antwort
// faellt die Funktion auf FALLBACK_RAST_SORTIMENT zurueck. Caching
// uebernimmt die Route via export const revalidate.
export async function fetchRastSortiment(): Promise<RastKaffee[]> {
  try {
    const res = await fetch(
      "https://www.rastshop.ch/wp-json/wc/store/v1/products?per_page=100",
      {
        headers: {
          "User-Agent": "via1-app/1.0 (+https://app.felsenau.org)",
          Accept: "application/json",
        },
        next: { revalidate: 60 * 60 * 24 * 7 },
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as WcProduct[] | unknown;
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("empty response");
    }
    const mapped = data
      .filter(isCoffeeProduct)
      .map(mapWcProduct)
      .filter((k): k is RastKaffee => k !== null);
    if (mapped.length < 5) {
      throw new Error(`only ${mapped.length} products parsed`);
    }
    return mapped;
  } catch (err) {
    console.warn("[rast-sortiment] scrape failed, using fallback:", err);
    return FALLBACK_RAST_SORTIMENT;
  }
}
