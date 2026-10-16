import Link from "next/link";
import { Logo } from "./Logo";

type Props = {
  title: string;
  subtitle: string;
  submit: string;
  withName?: boolean;
  altHref: string;
  altText: string;
};

export function AuthShell({ title, subtitle, submit, withName, altHref, altText }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <Logo />
        <div className="mt-8 rounded-3xl border border-ink/10 bg-white p-8 shadow-panel">
          <h1 className="text-3xl font-bold tracking-tightest">{title}</h1>
          <p className="mt-2 text-ink-soft">{subtitle}</p>
          <form className="mt-7 space-y-4">
            {withName && <Field id="name" label="Full name" type="text" autoComplete="name" />}
            <Field id="email" label="Email" type="email" autoComplete="email" />
            <Field id="password" label="Password" type="password" autoComplete="current-password" />
            <button type="button" className="btn-primary w-full">
              {submit}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link href={altHref} className="font-semibold text-ink underline underline-offset-4">
            {altText}
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({ id, label, type, autoComplete }: { id: string; label: string; type: string; autoComplete: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 outline-none transition-colors focus:border-lake"
      />
    </div>
  );
}
