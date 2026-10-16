import type { Case, Invoice, Payment, PricingQuote } from "@/lib/types";
import { mergeById, readBag } from "@/lib/demo-db";
import { api } from "./api";
import { applyEffects } from "./effects";

export async function getPricing(country: string): Promise<PricingQuote> {
  return api<PricingQuote>(`/api/pricing?country=${encodeURIComponent(country)}`);
}

export async function checkout(input: { caseId: string; userId: string; country: string; cardNumber: string; base?: Case }): Promise<{ payment: Payment; quote: PricingQuote }> {
  return api("/api/payments/checkout", { method: "POST", body: JSON.stringify(input) });
}

export async function confirmPayment(payment: Payment, base: Case, taxName: string): Promise<{ payment: Payment; invoice: Invoice; case: Case }> {
  const data = await api<{ payment: Payment; invoice: Invoice; case: Case; notification?: { id: string }; reviewNotification?: { id: string }; email?: { to: string; template: "payment_receipt"; props: Record<string, string> }; timeline?: { id: string } }>(
    `/api/payments/${payment.id}/confirm`,
    { method: "POST", body: JSON.stringify({ payment, base, taxName }) },
  );
  await applyEffects(data);
  return data;
}

export async function getInvoice(id: string): Promise<Invoice> {
  const local = readBag<Invoice>("invoices").upserts.find((item) => item.id === id);
  try {
    const seed = await api<Invoice>(`/api/invoices/${id}`);
    return mergeById([seed], "invoices").find((item) => item.id === id) ?? seed;
  } catch (error) {
    if (local) return local;
    throw error;
  }
}

export function invoiceForCase(caseId: string): Invoice | null {
  return readBag<Invoice>("invoices").upserts.find((item) => item.caseId === caseId) ?? null;
}
