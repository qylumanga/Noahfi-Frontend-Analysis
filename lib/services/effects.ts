import type { EmailDraft } from "@/lib/types";
import { upsert } from "@/lib/demo-db";
import { sendEmail } from "@/lib/email/send";

type Effects = {
  user?: { id: string };
  profile?: { id: string } | null;
  case?: { id: string };
  document?: { id: string };
  ledgerEntry?: { id: string };
  notification?: { id: string };
  reviewNotification?: { id: string };
  timeline?: { id: string };
  rating?: { id: string };
  report?: { id: string };
  feedback?: { id: string };
  payment?: { id: string };
  invoice?: { id: string };
  identity?: { id: string };
  qa?: { id: string };
  audit?: { id: string };
  grants?: { id: string }[];
  email?: EmailDraft;
};

export async function applyEffects(data: Effects): Promise<void> {
  if (data.user) upsert("users", data.user as never);
  if (data.profile) upsert("profiles", data.profile as never);
  if (data.case) upsert("cases", data.case as never);
  if (data.document) upsert("documents", data.document as never);
  if (data.ledgerEntry) upsert("ledger", data.ledgerEntry as never);
  if (data.notification) upsert("notifications", data.notification as never);
  if (data.reviewNotification) upsert("notifications", data.reviewNotification as never);
  if (data.timeline) upsert("timeline", data.timeline as never);
  if (data.rating) upsert("ratings", data.rating as never);
  if (data.report) upsert("reports", data.report as never);
  if (data.feedback) upsert("feedback", data.feedback as never);
  if (data.payment) upsert("payments", data.payment as never);
  if (data.invoice) upsert("invoices", data.invoice as never);
  if (data.identity) upsert("identity", data.identity as never);
  if (data.qa) upsert("qa", data.qa as never);
  if (data.audit) upsert("audit", data.audit as never);
  data.grants?.forEach((grant) => upsert("consents", grant as never));
  if (data.email) await sendEmail(data.email);
}
