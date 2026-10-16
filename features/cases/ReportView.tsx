"use client";

import { useEffect, useState } from "react";
import { ScoreGauge } from "@/components/ui/charts";
import { getReport, getWorkspace } from "@/lib/services/casesService";
import { HashChip } from "@/components/trust/HashChip";
import type { Report } from "@/lib/types";

export function ReportView({ caseId }: { caseId: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [reference, setReference] = useState("");
  const [hashes, setHashes] = useState<{ fileName: string; sha256: string }[]>([]);
  useEffect(() => {
    void (async () => {
      const [item, workspace] = await Promise.all([getReport(caseId), getWorkspace(caseId)]);
      setReport(item ?? workspace.report);
      setReference(workspace.case?.reference ?? "");
      setHashes(workspace.documents.map((doc) => ({ fileName: doc.fileName, sha256: doc.ledgerHash })));
    })();
  }, [caseId]);
  if (!report) return <p className="text-sm text-ink-soft">Preparing the report…</p>;
  return (
    <article className="mx-auto max-w-3xl bg-white p-8">
      <p className="text-sm font-semibold text-lake-dark">NOAHFI assessment report</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tightest">{reference}</h1>
      <div className="mt-6"><ScoreGauge score={report.score} band={report.band} /></div>
      <p className="mt-4 text-center text-sm">Confidence {report.confidence}%</p>
      <p className="mt-6">{report.summary}</p>
      <h2 className="mt-8 text-xl font-semibold">Factor breakdown</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {report.factors.map((factor) => <li key={factor.key}><strong>{factor.label}:</strong> {factor.justification || factor.score}</li>)}
      </ul>
      <h2 className="mt-8 text-xl font-semibold">Feedback</h2>
      <p className="mt-2">{report.feedback}</p>
      <h2 className="mt-8 text-xl font-semibold">Document fingerprints</h2>
      <ul className="mt-3 space-y-2">{hashes.map((item) => <li key={item.sha256} className="text-sm">{item.fileName} <HashChip hash={item.sha256} /></li>)}</ul>
      <button type="button" className="btn-primary no-print mt-8" onClick={() => window.print()}>Download PDF</button>
    </article>
  );
}
