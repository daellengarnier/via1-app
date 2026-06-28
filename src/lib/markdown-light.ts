// Minimaler Markdown-Renderer fuer das Protokoll-Feld der Sitzungen.
//
// Erlaubt: **fett**, *kursiv*, __unterstrichen__, - Liste (bullet),
// 1. Liste (ordered), sowie Zeilenumbrueche. KEIN Link-Markup, kein
// HTML, kein Code — XSS-Risiken sind explizit ausgeschlossen.
//
// Output ist sanitized HTML (jeder User-Input wird zuerst entity-
// escaped, danach werden nur die erlaubten Markdown-Marker durch
// Tags ersetzt). Resultat ist sicher fuer dangerouslySetInnerHTML.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(escaped: string): string {
  // Reihenfolge: zuerst die laengeren Marker, danach die kuerzeren,
  // damit ** nicht als 2x* gematcht wird.
  let s = escaped;
  s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_\n]+)__/g, "<u>$1</u>");
  s = s.replace(/(?:^|(?<=[^*]))\*([^*\n]+)\*(?=$|[^*])/g, "<em>$1</em>");
  s = s.replace(/(?:^|(?<=[^_]))_([^_\n]+)_(?=$|[^_])/g, "<em>$1</em>");
  return s;
}

export function renderMarkdown(input: string): string {
  if (!input) return "";
  const escaped = escapeHtml(input);
  const lines = escaped.split(/\r?\n/);

  type Kind = "ul" | "ol" | "p";
  const out: string[] = [];
  let listKind: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  function closeList() {
    if (listKind) {
      out.push(`</${listKind}>`);
      listKind = null;
    }
  }
  function flushParagraph() {
    if (paragraph.length > 0) {
      out.push(`<p>${paragraph.join("<br/>")}</p>`);
      paragraph = [];
    }
  }
  function switchKind(next: Kind) {
    if (next === "ul" || next === "ol") {
      flushParagraph();
      if (listKind !== next) {
        closeList();
        out.push(`<${next}>`);
        listKind = next;
      }
    } else {
      closeList();
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trimStart();
    if (trimmed === "") {
      flushParagraph();
      closeList();
      continue;
    }
    const bullet = trimmed.match(/^[-*•]\s+(.*)$/);
    const numbered = trimmed.match(/^\d+\.\s+(.*)$/);
    if (bullet) {
      switchKind("ul");
      out.push(`<li>${inline(bullet[1] ?? "")}</li>`);
      continue;
    }
    if (numbered) {
      switchKind("ol");
      out.push(`<li>${inline(numbered[1] ?? "")}</li>`);
      continue;
    }
    switchKind("p");
    paragraph.push(inline(trimmed));
  }
  flushParagraph();
  closeList();

  return out.join("");
}
