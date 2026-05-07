import { prisma } from "@/lib/prisma";
import type { NotificationKind } from "@prisma/client";

// Dynamisch importierte web-push-Library (nur wenn VAPID-Keys gesetzt)
let webpushLib: typeof import("web-push") | null = null;
let webpushInitialized = false;

async function getWebPush() {
  if (webpushInitialized) return webpushLib;
  webpushInitialized = true;
  if (
    !process.env.VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY
  ) {
    return null;
  }
  try {
    webpushLib = (await import("web-push")).default;
    webpushLib.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:admin@via1.ch",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    return webpushLib;
  } catch (err) {
    console.error("web-push init failed", err);
    return null;
  }
}

// Mapping: welches User-Feld steuert welche Benachrichtigungs-Kind
// Alle Kommentar-Benachrichtigungen (auf eigene Beitraege) laufen ueber
// die Sammel-Pref notifyMyPostsComment. Einzige Ausnahme: Anmeldungen auf
// Aktivitaeten nutzen auch ACTIVITY_COMMENT-kind (keine echten Kommentare)
// und landen ebenfalls im notifyMyPostsComment-Topf, da der User beides
// mit einer einzigen Einstellung kontrollieren soll.
const kindToPref: Record<NotificationKind, keyof PrefFields> = {
  SAUNA: "notifySauna",
  TERMIN_NEW: "notifyTermine",
  PUTZPLAN_MY_WG: "notifyPutzplan",
  KAFFEE_CHANGED: "notifyKaffee",
  PINNWAND_NEW: "notifyPinnwand",
  PINNWAND_COMMENT: "notifyMyPostsComment",
  FLOHMI_NEW: "notifyFlohmi",
  FLOHMI_TAKEN: "notifyFlohmi",
  AUFGABE_NEW: "notifyAufgaben",
  AUFGABE_STARTED: "notifyAufgabeStarted",
  BOOKING_COMMENT: "notifyMyPostsComment",
  ACTIVITY_NEW: "notifyActivity",
  ACTIVITY_COMMENT: "notifyMyPostsComment",
  SHOPPING_COMMENT: "notifyMyPostsComment",
  FEEDBACK_COMMENT: "notifyMyPostsComment",
  FEEDBACK_RESOLVED: "notifyMyPostsComment",
};

type PrefFields = {
  notifyTermine: boolean;
  notifyAufgaben: boolean;
  notifyAufgabeStarted: boolean;
  notifySauna: boolean;
  notifyPutzplan: boolean;
  notifyKaffee: boolean;
  notifyPinnwand: boolean;
  notifyFlohmi: boolean;
  notifyActivity: boolean;
  notifyMyPostsComment: boolean;
};

interface NotifyParams {
  kind: NotificationKind;
  title: string;
  body?: string;
  link?: string;
  // Zielgruppe: 'all' = alle User (ausser excludeUserId),
  //             string[] = konkrete User-IDs
  audience: "all" | string[];
  excludeUserId?: string;
}

export async function notify(params: NotifyParams): Promise<void> {
  const { kind, title, body, link, audience, excludeUserId } = params;
  const prefField = kindToPref[kind];

  // 1. Empfaenger ermitteln
  const where: Record<string, unknown> = {
    [prefField]: true,
    passwordSet: true,
  };
  if (audience !== "all") {
    where.id = excludeUserId
      ? { in: audience, not: excludeUserId }
      : { in: audience };
  } else if (excludeUserId) {
    where.id = { not: excludeUserId };
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });
  if (users.length === 0) return;

  // 2. In-App-Notifications in DB anlegen
  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      kind,
      title,
      body: body ?? null,
      link: link ?? null,
    })),
  });

  // 3. Push an alle Abonnements der Empfaenger
  const webpush = await getWebPush();
  if (!webpush) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: users.map((u) => u.id) } },
  });
  if (subs.length === 0) return;

  const payload = JSON.stringify({ title, body, link });
  const invalidSubs: string[] = [];
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
      } catch (err: unknown) {
        // 410 Gone / 404 -> Subscription gelöscht, entfernen
        const status = (err as { statusCode?: number } | null)?.statusCode;
        if (status === 410 || status === 404) {
          invalidSubs.push(sub.id);
        } else {
          console.error("push sendNotification failed", err);
        }
      }
    })
  );
  if (invalidSubs.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: invalidSubs } },
    });
  }
}
