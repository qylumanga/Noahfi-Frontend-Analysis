"use client";

import { CopyButton } from "@/components/ui/files";
import { Tooltip } from "@/components/ui/feedback";
import { truncateHash } from "@/lib/utils/format";

export function HashChip({ hash }: { hash: string }) {
  return (
    <Tooltip label={hash}>
      <span className="inline-flex items-center gap-2 rounded-full bg-glacier px-2.5 py-1 font-mono text-xs">
        {truncateHash(hash, 6)}
        <CopyButton value={hash} label="Copy hash" />
      </span>
    </Tooltip>
  );
}
