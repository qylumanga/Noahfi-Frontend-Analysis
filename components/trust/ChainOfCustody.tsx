import type { LedgerEntry } from "@/lib/types";
import { formatWhen, truncateHash } from "@/lib/utils/format";
import { Timeline } from "@/components/ui/progress";

const labels: Record<string, string> = {
  upload: "Uploaded",
  hash_recorded: "Hash recorded",
  viewed: "Viewed",
  reviewed: "Reviewed",
  shared: "Shared",
};

export function ChainOfCustody({ entries }: { entries: LedgerEntry[] }) {
  const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  if (!sorted.length) return <p className="text-sm text-ink-soft">No ledger entries yet.</p>;
  return (
    <Timeline
      items={sorted.map((entry) => ({
        title: labels[entry.action] ?? entry.action,
        detail: `${entry.actorRole} · block ${entry.index} · ${truncateHash(entry.blockHash, 6)}`,
        at: formatWhen(entry.timestamp),
        done: true,
      }))}
    />
  );
}
