"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Alert, Skeleton } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/fields";
import { ScoreGauge } from "@/components/ui/charts";
import { useSession } from "@/lib/hooks/useSession";
import { getWorkspace, saveRating, sendFeedback, submitQa } from "@/lib/services/casesService";
import { can, canEditRating } from "@/lib/utils/status";
import { bandFor } from "@/lib/utils/format";
import type { RatingAssessment } from "@/lib/types";

const FIELDS: { key: keyof RatingAssessment; label: string; note: keyof RatingAssessment }[] = [
  { key: "identityConfidence", label: "Identity confidence", note: "identityNote" },
  { key: "documentValidity", label: "Document validity", note: "documentNote" },
  { key: "bankingHistory", label: "Banking history quality", note: "bankingNote" },
  { key: "creditHistory", label: "Credit history quality", note: "creditNote" },
  { key: "fraudRisk", label: "Fraud risk flags", note: "fraudNote" },
  { key: "consistency", label: "Consistency checks", note: "consistencyNote" },
];

function blank(caseId: string): RatingAssessment {
  return {
    id: "", caseId, identityConfidence: 3, documentValidity: 3, bankingHistory: 3, creditHistory: 3, fraudRisk: 0, consistency: 3,
    identityNote: "", documentNote: "", bankingNote: "", creditNote: "", fraudNote: "", consistencyNote: "",
    computedScore: 660, finalScore: 660, confidence: 80, band: "Good", recommendation: "approve", rationale: "", qaStatus: "draft", factors: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

export function RatingWorkspace({ caseId }: { caseId: string }) {
  const { session } = useSession();
  const [rating, setRating] = useState<RatingAssessment | null>(null);
  const [caseStatus, setCaseStatus] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const holdDraft = useRef(false);
  const repaired = useRef(false);
  const editable = session ? canEditRating(session.user.role) : false;
  useEffect(() => {
    void getWorkspace(caseId).then((data) => {
      setRating(data.rating ?? blank(data.case?.id ?? caseId));
      setCaseStatus(data.case?.status ?? "");
    }).catch((err: Error) => setError(err.message));
  }, [caseId]);
  useEffect(() => {
    if (!rating || !editable || rating.qaStatus === "submitted" || holdDraft.current) return;
    const handle = window.setTimeout(() => { void saveRating(caseId, { ...rating, qaStatus: "draft" }).catch(() => undefined); }, 700);
    return () => window.clearTimeout(handle);
  }, [rating, editable, caseId]);
  useEffect(() => {
    if (!rating || !editable || repaired.current || rating.qaStatus !== "submitted") return;
    if (["quality_check", "finalized", "ready_to_download", "rejected"].includes(caseStatus)) return;
    repaired.current = true;
    holdDraft.current = true;
    void saveRating(caseId, { ...rating, qaStatus: "submitted" }).then(() => {
      setCaseStatus("quality_check");
      setNotice("Submitted. The case is now in quality check for a reviewer.");
    }).catch((err: Error) => setError(err.message));
  }, [rating, caseStatus, editable, caseId]);
  if (!rating) return error ? <Alert tone="error">{error}</Alert> : <Skeleton className="h-40" />;
  const fraudPoints = 5 - Math.min(5, rating.fraudRisk);
  const avg = (rating.identityConfidence + rating.documentValidity + rating.bankingHistory + rating.creditHistory + fraudPoints + rating.consistency) / 6;
  const computed = Math.max(300, Math.min(900, Math.round(300 + (avg / 5) * 600)));
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); holdDraft.current = true; void saveRating(caseId, { ...rating, qaStatus: "submitted", finalScore: rating.finalScore, computedScore: computed }).then((saved) => { setRating(saved); setError(""); setNotice("Submitted. The case is now in quality check for a reviewer."); }).catch((err: Error) => { holdDraft.current = false; setError(err.message); }); }}>
        <h1 className="text-2xl font-bold tracking-tight">Rating workspace</h1>
        {!editable && <Alert tone="info">You can view this score. Only analysts edit it.</Alert>}
        {FIELDS.map((field) => (
          <div key={field.key} className="rounded-2xl bg-white p-4">
            <label className="text-sm font-semibold" htmlFor={field.key}>{field.label}</label>
            <Input id={field.key} type="number" min={0} max={5} disabled={!editable} value={Number(rating[field.key])} onChange={(event) => setRating({ ...rating, [field.key]: Number(event.target.value) })} />
            <Textarea className="mt-2" aria-label={`${field.label} justification`} disabled={!editable} value={String(rating[field.note] ?? "")} onChange={(event) => setRating({ ...rating, [field.note]: event.target.value })} />
          </div>
        ))}
        <label className="block text-sm font-semibold" htmlFor="final">Final equivalent rating (300–900)</label>
        <Input id="final" type="number" min={300} max={900} disabled={!editable} value={rating.finalScore} onChange={(event) => setRating({ ...rating, finalScore: Number(event.target.value), band: bandFor(Number(event.target.value)).label })} />
        <label className="block text-sm font-semibold" htmlFor="confidence">Confidence %</label>
        <Input id="confidence" type="number" min={0} max={100} disabled={!editable} value={rating.confidence} onChange={(event) => setRating({ ...rating, confidence: Number(event.target.value) })} />
        <label className="block text-sm font-semibold" htmlFor="rationale">Internal rationale</label>
        <Textarea id="rationale" disabled={!editable} value={rating.rationale} onChange={(event) => setRating({ ...rating, rationale: event.target.value })} />
        <p className="text-sm">Recommendation: {rating.recommendation.replaceAll("_", " ")}. QA status: {rating.qaStatus}.</p>
        <div className="flex flex-wrap gap-2">
          {(["approve", "approve_with_conditions", "request_info", "decline"] as const).map((option) => (
            <Button key={option} type="button" variant={rating.recommendation === option ? "primary" : "secondary"} disabled={!editable} onClick={() => setRating({ ...rating, recommendation: option })}>{option.replaceAll("_", " ")}</Button>
          ))}
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}
        {editable && !(rating.qaStatus === "submitted" && ["quality_check", "finalized", "ready_to_download"].includes(caseStatus)) && <Button type="submit">Submit recommendation</Button>}
      </form>
      <aside className="rounded-3xl bg-white p-4">
        <ScoreGauge score={computed} band={bandFor(computed).label} />
        <p className="mt-2 text-center text-xs text-ink-soft">Live weighted score. Final rating can differ.</p>
      </aside>
    </div>
  );
}

export function QaScreen({ caseId }: { caseId: string }) {
  const { session } = useSession();
  const [summary, setSummary] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  useEffect(() => { void getWorkspace(caseId).then((data) => { setSummary(data.rating?.rationale || data.rating?.recommendation || ""); setScore(data.rating?.finalScore ?? 0); setStatus(data.case?.status ?? ""); }); }, [caseId]);
  if (!session || !can(session.user.role, "qa")) return <Alert tone="warning" title="Reviewers only">Your role can view the queue, not this decision.</Alert>;
  const risk = status && !["ready_to_download", "finalized", "rejected"].includes(status);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Quality review</h1>
      {risk && <Alert tone="warning" title="SLA risk">Check the countdown on the case. Cases under 8 hours are flagged in the queue.</Alert>}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl bg-white p-4"><h2 className="font-semibold">Analyst recommendation</h2><p className="mt-2 text-sm">{summary || "No recommendation yet."}</p><p className="mt-2 text-sm">Proposed score {score}</p></section>
        <section className="rounded-2xl bg-white p-4"><h2 className="font-semibold">Proposed final outcome</h2><p className="mt-2 text-sm">Approve locks the score. Send back returns the case to the analyst. Differences are the reason you enter below.</p></section>
      </div>
      <Textarea aria-label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" />
      {message && <Alert tone="success">{message}</Alert>}
      <div className="flex flex-wrap gap-2">
        {(["approve", "revise", "send_back", "escalate"] as const).map((decision) => (
          <Button key={decision} type="button" variant={decision === "escalate" ? "danger" : "secondary"} onClick={() => void submitQa(caseId, decision, reason || "Reviewed.", session.user).then(() => setMessage(`Recorded: ${decision.replaceAll("_", " ")}`))}>{decision.replaceAll("_", " ")}</Button>
        ))}
      </div>
      <Link className="text-sm font-semibold underline" href={`/internal/cases/${caseId}/feedback`}>Continue to feedback</Link>
    </div>
  );
}

export function FeedbackComposer({ caseId }: { caseId: string }) {
  const { session } = useSession();
  const [summary, setSummary] = useState("Your home-country history supports a Canadian-equivalent profile. Because you do not yet have Canadian credit history, early limits at a bank may be modest until local accounts have a few months of activity.");
  const [visible, setVisible] = useState(true);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<RatingAssessment | undefined>();
  useEffect(() => { void getWorkspace(caseId).then((data) => { if (data.feedback?.summary) setSummary(data.feedback.summary); if (data.rating) setRating(data.rating); }); }, [caseId]);
  if (!session || !can(session.user.role, "feedback")) return <Alert tone="warning" title="Reviewers only">Feedback is sent by a reviewer.</Alert>;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Customer feedback</h1>
      <Textarea aria-label="Customer feedback" value={summary} onChange={(event) => setSummary(event.target.value)} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} />Visible to bank partner</label>
      <section className="rounded-2xl border border-ink/10 bg-white p-4 text-sm"><h2 className="font-semibold">Report preview</h2><p className="mt-2">{summary}</p>{rating && <p className="mt-2">Score {rating.finalScore} ({rating.band}), confidence {rating.confidence}%.</p>}</section>
      {message && <Alert tone="success">{message}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Link className="btn-secondary" href={`/cases/${caseId}/report`}>Preview final report</Link>
        <Button type="button" onClick={() => void sendFeedback(caseId, summary, visible, session.user, rating).then(() => setMessage("Sent to the requester. The report is ready to download."))}>Send to requester</Button>
      </div>
    </div>
  );
}
