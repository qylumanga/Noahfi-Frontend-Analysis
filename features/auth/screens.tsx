"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { AuthShell } from "@/components/marketing/AuthShell";
import { Button } from "@/components/ui/Button";
import { Checkbox, FormField, Input, PhoneInput } from "@/components/ui/fields";
import { Alert } from "@/components/ui/feedback";
import { ApiError } from "@/lib/services/api";
import { forgotPassword, login, resendOtp, signup, verifyOtp } from "@/lib/services/authService";
import { forgotSchema, loginSchema, signupSchema } from "@/lib/types/schemas";
import { portalFor } from "@/lib/utils/status";
import type { Role } from "@/lib/types";
import { DemoAccountPanel } from "./DemoAccountPanel";
import { CUSTOMER_DEMOS, INTERNAL_DEMOS, PARTNER_DEMOS, type DemoLogin } from "./demoAccounts";

function errorsOf(error: unknown): Record<string, string> {
  if (error instanceof ApiError && error.fieldErrors) return error.fieldErrors;
  return {};
}

export function LoginScreen({ portal }: { portal: "customer" | "partner" | "internal" }) {
  const router = useRouter();
  const params = useSearchParams();
  const demos = portal === "partner" ? PARTNER_DEMOS : portal === "internal" ? INTERNAL_DEMOS : CUSTOMER_DEMOS;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [otp, setOtp] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function fill(account: DemoLogin) {
    setEmail(account.email);
    setPassword(account.password);
    setOtp(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const parsed = loginSchema.safeParse({ email, password: otp ? undefined : password, code: otp ? code : undefined });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => { next[issue.path.join(".") || "form"] = issue.message; });
      setFields(next);
      return;
    }
    setLoading(true);
    try {
      const session = await login(parsed.data);
      const expected: Role[] = portal === "customer" ? ["customer"] : portal === "partner" ? ["partner"] : ["analyst", "reviewer", "admin", "compliance"];
      if (!expected.includes(session.user.role)) {
        setError(`This account is a ${session.user.role}. Use the matching sign-in page, or continue to your workspace.`);
        router.push(portalFor(session.user.role));
        return;
      }
      router.push(portalFor(session.user.role));
    } catch (err) {
      setFields(errorsOf(err));
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  const copy = {
    customer: ["Welcome back", "Log in to follow your case.", "/signup", "New here? Create an account"],
    partner: ["Partner portal", "For participating financial institutions.", "/", "Back to NOAHFI"],
    internal: ["Staff sign in", "For NOAHFI analysts and staff.", "/", "Back to NOAHFI"],
  }[portal];

  return (
    <AuthShell title={copy[0]} subtitle={copy[1]} altHref={copy[2]} altText={copy[3]}>
      {params.get("reset") === "1" && <Alert tone="success" title="Reset link opened">Use your password to sign in. Demo accounts use demo1234.</Alert>}
      <form className="mt-4 space-y-4" onSubmit={(event) => void submit(event)}>
        <FormField id="email" label="Email" error={fields.email}>
          <Input id="email" type="email" autoComplete="email" value={email} aria-invalid={!!fields.email} onChange={(event) => setEmail(event.target.value)} />
        </FormField>
        {otp ? (
          <FormField id="code" label="One-time code" hint="Demo code is 123456. It is also in the email outbox." error={fields.code}>
            <Input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} />
          </FormField>
        ) : (
          <FormField id="password" label="Password" error={fields.password}>
            <Input id="password" type="password" autoComplete="current-password" value={password} aria-invalid={!!fields.password} onChange={(event) => setPassword(event.target.value)} />
          </FormField>
        )}
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" className="w-full" loading={loading}>Log in</Button>
      </form>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <button type="button" className="font-semibold underline" onClick={() => setOtp((value) => !value)}>{otp ? "Use a password instead" : "Use a one-time code instead"}</button>
        <a className="font-semibold underline" href="/forgot-password">Forgot password</a>
      </div>
      <DemoAccountPanel accounts={demos} onFill={fill} />
    </AuthShell>
  );
}

export function SignupScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", phoneCountry: "IN", phone: "", fullName: "", passportNumber: "", nationalId: "", password: "", consent: false });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = signupSchema.safeParse({ ...form, consent: form.consent ? true : undefined });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => { next[issue.path.join(".") || "consent"] = issue.message; });
      setFields(next);
      return;
    }
    setLoading(true);
    try {
      await signup(parsed.data);
      router.push(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
    } catch (err) {
      setFields(errorsOf(err));
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Start your assessment"
      subtitle="Create your account and verify your email."
      altHref="/login"
      altText="Already have an account? Log in"
      aside={<div className="space-y-4 text-sm text-ink-soft"><Lock className="text-lake" /><h2 className="font-display text-2xl font-semibold text-ink">Why we ask for this</h2><p>Your passport number and national ID let an analyst match the credit report to you. Files are fingerprinted on the Trust Ledger. Only staff working your case, and banks you later approve, can see them.</p><p>Result within 48 hours of payment. The fee is USD 100 plus local tax.</p></div>}
    >
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <FormField id="fullName" label="Full legal name" hint="As it appears on your passport." error={fields.fullName}>
          <Input id="fullName" autoComplete="name" value={form.fullName} aria-invalid={!!fields.fullName} onChange={(event) => set("fullName", event.target.value)} />
        </FormField>
        <FormField id="email" label="Email" error={fields.email}>
          <Input id="email" type="email" autoComplete="email" value={form.email} aria-invalid={!!fields.email} onChange={(event) => set("email", event.target.value)} />
        </FormField>
        <FormField id="phone" label="Phone" hint="We use this if we need to reach you about the case." error={fields.phone}>
          <PhoneInput id="phone" country={form.phoneCountry} number={form.phone} invalid={!!fields.phone} onCountry={(value) => set("phoneCountry", value)} onNumber={(value) => set("phone", value)} />
        </FormField>
        <FormField id="password" label="Password" hint="At least 8 characters." error={fields.password}>
          <Input id="password" type="password" autoComplete="new-password" value={form.password} aria-invalid={!!fields.password} onChange={(event) => set("password", event.target.value)} />
        </FormField>
        <FormField id="passport" label="Passport number" hint="Why we ask: it ties the credit report to your identity." error={fields.passportNumber}>
          <Input id="passport" value={form.passportNumber} aria-invalid={!!fields.passportNumber} onChange={(event) => set("passportNumber", event.target.value)} />
        </FormField>
        <FormField id="nationalId" label="National ID number" error={fields.nationalId}>
          <Input id="nationalId" value={form.nationalId} aria-invalid={!!fields.nationalId} onChange={(event) => set("nationalId", event.target.value)} />
        </FormField>
        <Checkbox id="consent" checked={form.consent} onChange={(event) => set("consent", event.target.checked)} label="I agree to the terms and to NOAHFI processing my personal data for this assessment." />
        {fields.consent && <p className="text-sm font-medium text-maple">{fields.consent}</p>}
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" className="w-full" loading={loading}>Create account</Button>
      </form>
    </AuthShell>
  );
}

export function VerifyEmailScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [left, setLeft] = useState(30);
  const [done, setDone] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (left <= 0) return;
    const timer = window.setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left]);

  function apply(next: string[]) {
    setDigits(next);
    const code = next.join("");
    if (code.length === 6) void submit(code);
  }

  async function submit(code: string) {
    setError("");
    try {
      await verifyOtp(email, code);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code is not correct.");
    }
  }

  return (
    <AuthShell title="Check your email" subtitle={`Enter the 6-digit code sent to ${email || "your inbox"}.`} altHref="/login" altText="Back to log in">
      {done ? (
        <Alert tone="success" title="Email verified">
          <a className="font-semibold underline" href={`/login?email=${encodeURIComponent(email)}`}>Continue to log in</a>
        </Alert>
      ) : (
        <div>
          <p className="mb-3 text-sm text-ink-soft">Demo hint: the code is 123456. You can also open it from Demo controls → email outbox.</p>
          <div className="flex gap-2" onPaste={(event) => {
            const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (!text) return;
            event.preventDefault();
            apply(text.padEnd(6).slice(0, 6).split(""));
          }}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(node) => { inputs.current[index] = node; }}
                inputMode="numeric"
                aria-label={`Digit ${index + 1}`}
                className="h-14 w-12 rounded-xl border border-ink/15 text-center text-xl font-semibold"
                value={digit}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "").slice(-1);
                  const next = [...digits];
                  next[index] = value;
                  apply(next);
                  if (value) inputs.current[index + 1]?.focus();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !digits[index]) inputs.current[index - 1]?.focus();
                }}
              />
            ))}
          </div>
          {error && <p className="mt-3 text-sm font-medium text-maple" role="alert">{error}</p>}
          <p className="mt-4 text-sm">
            {left > 0 ? <span>Resend available in {left}s</span> : <button type="button" className="font-semibold underline" onClick={() => { setLeft(30); void resendOtp(email); }}>Resend code</button>}
          </p>
          <Button className="mt-4" type="button" onClick={() => router.push(`/login?email=${encodeURIComponent(email)}`)}>I already have an account</Button>
        </div>
      )}
    </AuthShell>
  );
}

export function ForgotScreen() {
  const [email, setEmail] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = forgotSchema.safeParse({ email });
    if (!parsed.success) {
      setFields({ email: parsed.error.issues[0]?.message ?? "Enter a valid email." });
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Reset your password" subtitle="We will put a reset message in the demo outbox." altHref="/login" altText="Back to log in">
      {sent ? <Alert tone="success" title="Check the outbox">If an account exists for that email, a message is waiting in Demo controls. Demo passwords stay demo1234.</Alert> : (
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <FormField id="email" label="Email" error={fields.email}>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </FormField>
          <Button type="submit" loading={loading}>Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
