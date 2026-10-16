"use client";

import type { DemoLogin } from "./demoAccounts";

export function DemoAccountPanel({ accounts, onFill }: { accounts: DemoLogin[]; onFill: (account: DemoLogin) => void }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-ink/15 bg-glacier/60 p-4">
      <p className="text-sm font-semibold">Use demo account</p>
      <p className="mt-1 text-xs text-ink-soft">These credentials are part of the demo. Password for every account is demo1234.</p>
      <ul className="mt-3 space-y-2">
        {accounts.map((account) => (
          <li key={account.email}>
            <button type="button" className="w-full rounded-xl bg-white px-3 py-2 text-left hover:border-ink/20" onClick={() => onFill(account)}>
              <span className="block text-sm font-semibold">{account.name}</span>
              <span className="block text-xs text-ink-soft">{account.role} · {account.email}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
