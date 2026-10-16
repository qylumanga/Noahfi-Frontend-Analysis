import type { EmailTemplateId } from "@/lib/types";

export const EMAIL_SUBJECTS: Record<EmailTemplateId, string> = {
  otp: "Your NOAHFI verification code",
  welcome: "Welcome to NOAHFI",
  documents_received: "We received your documents",
  payment_receipt: "Payment receipt",
  under_review: "Your case is under review",
  report_ready: "Your NOAHFI report is ready",
  info_requested: "We need a bit more information",
};
