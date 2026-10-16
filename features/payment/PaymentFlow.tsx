"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/fields";
import { Alert } from "@/components/ui/feedback";
import { checkout, confirmPayment, getPricing } from "@/lib/services/paymentsService";
import { getCase } from "@/lib/services/casesService";
import { getMe } from "@/lib/services/authService";
import { useSession } from "@/lib/hooks/useSession";
import { formatCard, luhnOk } from "@/lib/utils/format";
import { MARKET_OPTIONS, money } from "@/lib/utils/money";
import type { PricingQuote } from "@/lib/types";

export function PaymentFlow() {
  const params = useParams<{ caseId: string }>();
  const router = useRouter();
  const { session } = useSession();
  const [country, setCountry] = useState("CA");
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getMe().then((me) => {
      const next = me.profile?.originCountry || "CA";
      setCountry(next);
      setName(me.user.name);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    void getPricing(country).then(setQuote).catch((err: Error) => setError(err.message));
  }, [country]);

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    if (!session || !quote) return;
    if (!luhnOk(card)) {
      setError("Card number is not valid.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const base = await getCase(params.caseId);
      const started = await checkout({ caseId: base.id, userId: session.user.id, country, cardNumber: card, base });
      await confirmPayment(started.payment, base, quote.taxName);
      router.push(`/requests/${base.id}/confirmation`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. You can retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_0.8fr]">
      <form className="space-y-4 rounded-3xl border border-ink/10 bg-white p-6" onSubmit={(event) => void pay(event)}>
        <h1 className="text-3xl font-bold tracking-tightest">Secure payment</h1>
        <p className="text-sm text-ink-soft">NOAHFI checkout. USD 100 plus local tax. Result within 48 hours.</p>
        <FormField id="country" label="Tax country">
          <Select id="country" value={country} onChange={(event) => setCountry(event.target.value)}>
            {MARKET_OPTIONS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
          </Select>
        </FormField>
        <FormField id="name" label="Name on card"><Input id="name" value={name} onChange={(event) => setName(event.target.value)} required /></FormField>
        <FormField id="card" label="Card number" hint="Success: 4242 4242 4242 4242. Decline: 4000 0000 0000 0002." error={error && error.toLowerCase().includes("card") ? error : undefined}>
          <Input id="card" inputMode="numeric" autoComplete="cc-number" value={formatCard(card)} onChange={(event) => setCard(event.target.value)} required />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField id="expiry" label="Expiry"><Input id="expiry" placeholder="MM/YY" autoComplete="cc-exp" value={expiry} onChange={(event) => setExpiry(event.target.value)} required /></FormField>
          <FormField id="cvc" label="CVC"><Input id="cvc" autoComplete="cc-csc" value={cvc} onChange={(event) => setCvc(event.target.value)} required /></FormField>
        </div>
        {error && <Alert tone="error" title="Payment did not go through">{error}</Alert>}
        <Button type="submit" className="w-full" loading={loading}>Pay {quote ? money(quote.totalUsd, "USD") : ""}</Button>
      </form>
      <aside className="rounded-3xl border border-ink/10 bg-white p-6">
        <h2 className="text-lg font-semibold">Order summary</h2>
        {quote ? (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Assessment</dt><dd>{money(quote.baseUsd, "USD")}</dd></div>
            <div className="flex justify-between"><dt>{quote.taxName} ({Math.round(quote.taxRate * 100)}%)</dt><dd>{money(quote.taxUsd, "USD")}</dd></div>
            <div className="flex justify-between border-t border-ink/10 pt-2 font-semibold"><dt>Total</dt><dd>{money(quote.totalUsd, "USD")}</dd></div>
            <div className="flex justify-between text-ink-soft"><dt>Approx. in {quote.currency}</dt><dd>{money(quote.totalLocal, quote.currency)}</dd></div>
          </dl>
        ) : <p className="mt-4 text-sm text-ink-soft">Loading price…</p>}
      </aside>
    </div>
  );
}

export function Confirmation() {
  const params = useParams<{ caseId: string }>();
  const [reference, setReference] = useState("");
  const [due, setDue] = useState("");
  const [total, setTotal] = useState("");
  const [number, setNumber] = useState("");
  useEffect(() => {
    void (async () => {
      const kase = await getCase(params.caseId);
      setReference(kase.reference);
      setDue(new Date(kase.slaDueAt).toLocaleString("en-CA"));
      const { invoiceForCase } = await import("@/lib/services/paymentsService");
      const invoice = invoiceForCase(kase.id);
      if (invoice) {
        setTotal(money(invoice.totalUsd, "USD"));
        setNumber(invoice.number);
      }
    })();
  }, [params.caseId]);
  return (
    <article className="mx-auto max-w-2xl rounded-3xl border border-ink/10 bg-white p-8">
      <p className="text-sm font-semibold text-lake-dark">Payment confirmed</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tightest">Your result is due within 48 hours</h1>
      <p className="mt-3 text-ink-soft">Case {reference}. Deadline: {due}.</p>
      <div className="mt-6 rounded-2xl bg-glacier p-4 text-sm">
        <p className="font-semibold">Invoice {number || "pending"}</p>
        <p>Total paid {total || "USD 100 plus tax"}.</p>
        <p className="mt-2">A receipt was sent. Open <a className="font-semibold underline" href="/outbox" target="_blank" rel="noreferrer">/outbox</a> in another tab to read it.</p>
      </div>
      <div className="no-print mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn-secondary" onClick={() => window.print()}>Download PDF</button>
        <a className="btn-primary" href="/dashboard">Back to dashboard</a>
      </div>
    </article>
  );
}
