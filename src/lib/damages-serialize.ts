import type { RoomDamage, RoomDamageFeedback, User } from "@prisma/client";

export interface DamagePinDTO { lat: number; lng: number }

export function serializeDamage(
  d: RoomDamage & {
    reportedBy: User | null;
    feedbacks?: (RoomDamageFeedback & { author: User })[];
  }
) {
  return {
    id: d.id,
    title: d.title || d.description.slice(0, 60),
    description: d.description,
    roomKey: d.roomKey,
    location: d.location,
    category: d.category,
    status: d.status,
    severity: d.severity,
    pin: d.pinLat != null && d.pinLng != null ? { lat: d.pinLat, lng: d.pinLng } : null,
    imageData: d.imageData,
    invoiceData: d.invoiceData,
    invoiceName: d.invoiceName,
    costCents: d.costCents,
    appointmentAt: d.appointmentAt?.toISOString() ?? null,
    reportedAt: d.reportedAt.toISOString(),
    resolvedAt: d.resolvedAt?.toISOString() ?? null,
    reportedBy: d.reportedBy?.name ?? null,
    reportedById: d.reportedById,
    feedbacks: (d.feedbacks ?? []).map((f) => ({
      id: f.id,
      text: f.text,
      author: f.author.name,
      authorId: f.authorId,
      createdAt: f.createdAt.toISOString(),
    })),
  };
}
