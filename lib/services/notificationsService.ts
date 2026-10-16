import type { EmailMessage, Notification } from "@/lib/types";
import { mergeById, upsert } from "@/lib/demo-db";
import { api } from "./api";

export async function listNotifications(): Promise<Notification[]> {
  const seed = await api<Notification[]>("/api/notifications");
  return mergeById(seed, "notifications").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markRead(id: string, current?: Notification): Promise<Notification> {
  const saved = await api<Notification>(`/api/notifications/${id}/read`, {
    method: "PATCH",
    body: JSON.stringify({ base: current }),
  });
  upsert("notifications", saved);
  return saved;
}

export async function listEmails(): Promise<EmailMessage[]> {
  const seed = await api<EmailMessage[]>("/api/emails");
  return mergeById(seed, "emails").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
