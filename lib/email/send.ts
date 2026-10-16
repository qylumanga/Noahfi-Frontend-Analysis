import type { EmailDraft, EmailMessage } from "@/lib/types";
import { upsert } from "@/lib/demo-db";
import { EMAIL_SUBJECTS } from "@/lib/email/subjects";
import { pushToast } from "@/lib/hooks/toast-bus";
import { cuid, nowIso } from "@/lib/utils/id";

export async function sendEmail(draft: EmailDraft): Promise<EmailMessage> {
  const at = nowIso();
  const message: EmailMessage = {
    id: cuid("em"),
    to: draft.to,
    template: draft.template,
    subject: EMAIL_SUBJECTS[draft.template],
    props: draft.props,
    href: draft.props.href ?? "/outbox",
    createdAt: at,
    updatedAt: at,
  };
  upsert("emails", message);
  pushToast({ title: `Email sent: ${message.subject}`, href: "/outbox", tone: "success" });
  return message;
}
