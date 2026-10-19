import type { EmailMessage } from "@/lib/types";
import { Logo } from "@/components/marketing/Logo";

export function EmailPreview({ message }: { message: EmailMessage }) {
  const name = message.props.name ?? "there";
  return (
    <article className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="border-b border-ink/10 bg-glacier px-5 py-4">
        <Logo compact />
        <p className="mt-3 text-xs text-ink-soft">To {message.to}</p>
        <h2 className="text-lg font-semibold">{message.subject}</h2>
      </div>
      <div className="space-y-3 px-5 py-5 text-sm leading-relaxed">
        <p>Hello {name},</p>
        {message.template === "otp" && (
          <>
            <p>Your verification code is <strong className="font-mono text-lg tracking-widest">{message.props.code}</strong>.</p>
            <p>It expires when you leave this demo. The demo code is always 123456.</p>
          </>
        )}
        {message.template === "welcome" && <p>Your email is verified. You can sign in and start an assessment. A result is ready within 48 hours of payment.</p>}
        {message.template === "documents_received" && <p>We received {message.props.fileName}. A fingerprint was written to the NOAHFI Trust Ledger.</p>}
        {message.template === "payment_receipt" && <p>Payment for {message.props.reference} is confirmed. USD {message.props.total} was charged, including local tax. Your result is due within 48 hours.</p>}
        {message.template === "under_review" && <p>{message.props.reference} is with an analyst.</p>}
        {message.template === "report_ready" && <p>Your Canadian-equivalent profile for {message.props.reference} is ready to download.</p>}
        {message.template === "info_requested" && <p>{message.props.message}</p>}
        {message.props.href && <p><a className="font-semibold text-lake-dark underline" href={message.props.href}>Open in NOAHFI</a></p>}
      </div>
    </article>
  );
}
