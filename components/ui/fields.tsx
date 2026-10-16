"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const control = "w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors focus:border-lake";

export function FormField({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  const described = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <div data-describedby={described}>{children}</div>
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-maple" role="alert">{error}</p>}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, props["aria-invalid"] && "border-maple", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-28 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, className)} {...props}>
      {children}
    </select>
  );
}

export const DIAL_CODES = [
  { code: "CA", dial: "+1", label: "Canada" },
  { code: "US", dial: "+1", label: "United States" },
  { code: "GB", dial: "+44", label: "United Kingdom" },
  { code: "IN", dial: "+91", label: "India" },
  { code: "NG", dial: "+234", label: "Nigeria" },
  { code: "PH", dial: "+63", label: "Philippines" },
  { code: "MX", dial: "+52", label: "Mexico" },
  { code: "BR", dial: "+55", label: "Brazil" },
  { code: "PK", dial: "+92", label: "Pakistan" },
  { code: "CO", dial: "+57", label: "Colombia" },
];

export function PhoneInput({ id, country, number, onCountry, onNumber, invalid }: { id: string; country: string; number: string; onCountry: (value: string) => void; onNumber: (value: string) => void; invalid?: boolean }) {
  return (
    <div className={cn("flex overflow-hidden rounded-xl border border-ink/15 focus-within:border-lake", invalid && "border-maple")}>
      <label className="sr-only" htmlFor={`${id}-country`}>Country code</label>
      <select id={`${id}-country`} value={country} onChange={(event) => onCountry(event.target.value)} className="bg-glacier px-2 py-2.5 text-sm outline-none">
        {DIAL_CODES.map((item) => (
          <option key={item.code} value={item.code}>{item.dial} {item.label}</option>
        ))}
      </select>
      <input id={id} inputMode="tel" autoComplete="tel" value={number} onChange={(event) => onNumber(event.target.value)} className="w-full px-3 py-2.5 outline-none" aria-invalid={invalid || undefined} />
    </div>
  );
}

export function Checkbox({ id, label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 text-sm">
      <input id={id} type="checkbox" className="mt-0.5 h-4 w-4 accent-lake" {...props} />
      <span>{label}</span>
    </label>
  );
}

export function Radio({ name, options, value, onChange }: { name: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label key={option.value} className={cn("cursor-pointer rounded-full border px-3 py-1.5 text-sm", value === option.value ? "border-ink bg-ink text-white" : "border-ink/15 bg-white")}>
          <input className="sr-only" type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
          {option.label}
        </label>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-lake" : "bg-ink/20")}>
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}
