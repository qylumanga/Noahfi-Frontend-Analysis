"use client";

import { useState } from "react";
import { Alert, Skeleton, StatusTag } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/fields";
import { Tabs } from "@/components/ui/data";
import { usePolling } from "@/lib/hooks/usePolling";
import { useSession } from "@/lib/hooks/useSession";
import { addNote, flagCase, getWorkspace, saveTask } from "@/lib/services/casesService";
import { ChainOfCustody } from "@/components/trust/ChainOfCustody";
import { IntegrityBadge } from "@/components/trust/IntegrityBadge";
import { cn } from "@/lib/utils/cn";
import { formatWhen } from "@/lib/utils/format";
import type { Feedback, QaReview, RatingAssessment, Role } from "@/lib/types";

function seesFullRecord(role: Role | undefined): boolean {
  return role === "reviewer" || role === "admin";
}

function RecordCards({
  role,
  rating,
  qa,
  feedback,
  open,
  onOpen,
}: {
  role: Role | undefined;
  rating: RatingAssessment | null;
  qa: QaReview | null;
  feedback: Feedback | null;
  open: string;
  onOpen: (id: string) => void;
}) {
  const cards = [
    {
      id: "rating",
      label: "Ratings",
      headline: rating ? `${rating.finalScore} · ${rating.band}` : "Not scored",
      detail: rating ? `${rating.confidence}% confidence · ${rating.recommendation.replaceAll("_", " ")}` : "Waiting on the analyst",
    },
    ...(seesFullRecord(role)
      ? [
          {
            id: "qa",
            label: "QA",
            headline: qa ? qa.decision.replaceAll("_", " ") : "Not reviewed",
            detail: qa?.reason || "Opens after the analyst submits a rating",
          },
          {
            id: "feedback",
            label: "Feedback",
            headline: feedback?.sentAt ? "Sent" : "Not sent",
            detail: feedback?.summary || "Written after quality review",
          },
        ]
      : []),
  ];
  return (
    <div className="space-y-3">
      <div className={cn("grid gap-3", cards.length > 1 ? "sm:grid-cols-3" : "sm:max-w-sm")}>
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            aria-pressed={open === card.id}
            onClick={() => onOpen(open === card.id ? "" : card.id)}
            className={cn("rounded-2xl border p-4 text-left", open === card.id ? "border-lake bg-white shadow-panel" : "border-ink/10 bg-white hover:border-lake/40")}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-lake-dark">{card.label}</p>
            <p className="mt-1 font-semibold capitalize">{card.headline}</p>
            <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{card.detail}</p>
          </button>
        ))}
      </div>
      {open === "rating" && (
        <section className="rounded-2xl bg-white p-4 text-sm">
          <h2 className="font-semibold">Rating record</h2>
          {rating ? (
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              <div><dt className="text-ink-soft">Score</dt><dd>{rating.finalScore} ({rating.band})</dd></div>
              <div><dt className="text-ink-soft">Confidence</dt><dd>{rating.confidence}%</dd></div>
              <div><dt className="text-ink-soft">Recommendation</dt><dd className="capitalize">{rating.recommendation.replaceAll("_", " ")}</dd></div>
              <div><dt className="text-ink-soft">QA status</dt><dd className="capitalize">{rating.qaStatus.replaceAll("_", " ")}</dd></div>
              <div><dt className="text-ink-soft">Identity</dt><dd>{rating.identityConfidence} / 5</dd></div>
              <div><dt className="text-ink-soft">Documents</dt><dd>{rating.documentValidity} / 5</dd></div>
              <div><dt className="text-ink-soft">Banking</dt><dd>{rating.bankingHistory} / 5</dd></div>
              <div><dt className="text-ink-soft">Credit</dt><dd>{rating.creditHistory} / 5</dd></div>
              <div className="sm:col-span-2"><dt className="text-ink-soft">Internal rationale</dt><dd>{rating.rationale || "None written yet."}</dd></div>
            </dl>
          ) : <p className="mt-2 text-ink-soft">No rating on this case yet.</p>}
        </section>
      )}
      {open === "qa" && seesFullRecord(role) && (
        <section className="rounded-2xl bg-white p-4 text-sm">
          <h2 className="font-semibold">Quality review</h2>
          {qa ? <p className="mt-2 capitalize">{qa.decision.replaceAll("_", " ")}. {qa.reason}</p> : <p className="mt-2 text-ink-soft">No quality review yet.</p>}
        </section>
      )}
      {open === "feedback" && seesFullRecord(role) && (
        <section className="rounded-2xl bg-white p-4 text-sm">
          <h2 className="font-semibold">Customer feedback</h2>
          {feedback ? (
            <>
              <p className="mt-2">{feedback.summary}</p>
              <p className="mt-2 text-ink-soft">{feedback.visibleToPartner ? "Visible to the bank partner." : "Hidden from the bank partner."} {feedback.sentAt ? `Sent ${formatWhen(feedback.sentAt)}.` : "Not sent."}</p>
            </>
          ) : <p className="mt-2 text-ink-soft">No feedback yet.</p>}
        </section>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="mt-1 font-medium">{value || "Not provided"}</dd>
    </div>
  );
}

export function Workspace({ caseId }: { caseId: string }) {
  const { session } = useSession();
  const query = usePolling(`ws-${caseId}`, () => getWorkspace(caseId), { intervalMs: 8000 });
  const [tab, setTab] = useState("applicant");
  const [note, setNote] = useState("");
  const [flagTitle, setFlagTitle] = useState("");
  const [flagDetail, setFlagDetail] = useState("");
  const [record, setRecord] = useState("rating");
  const data = query.data;
  const kase = data?.case;
  const role = session?.user.role;
  const canTick = role === "analyst";

  if (query.isLoading) return <Skeleton className="h-64" />;
  if (query.error || !kase || !session || !data) return <Alert tone="error" title="Case unavailable"><button type="button" className="underline" onClick={() => void query.mutate()}>Retry</button></Alert>;

  const phone = data.profile?.phone || data.applicant?.phone || "";
  const phoneLabel = data.profile?.phoneCountry ? `${data.profile.phoneCountry} ${phone}`.trim() : phone;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{kase.reference}</h1>
          <p className="text-sm text-ink-soft">{kase.countryName} · risk {kase.riskLevel}</p>
        </div>
        <StatusTag status={kase.status} />
      </div>
      {kase.slaDueAt && new Date(kase.slaDueAt).getTime() - Date.now() < 8 * 3600_000 && !["ready_to_download", "rejected", "finalized"].includes(kase.status) && (
        <Alert tone="warning" title="SLA risk">Less than 8 hours remain on the 48-hour promise.</Alert>
      )}
      <RecordCards role={role} rating={data.rating} qa={data.qa} feedback={data.feedback} open={seesFullRecord(role) || record === "rating" ? record : "rating"} onOpen={setRecord} />
      <Tabs tabs={[{ id: "applicant", label: "Applicant" }, { id: "documents", label: "Documents" }, { id: "identity", label: "Identity" }, { id: "source", label: "Source data" }, { id: "tasks", label: "Tasks" }, { id: "notes", label: "Notes" }, { id: "alerts", label: "Alerts" }, { id: "timeline", label: "Timeline" }]} value={tab} onChange={setTab} />
      {tab === "applicant" && (
        <section className="rounded-2xl bg-white p-4 text-sm">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={data.profile?.fullName || data.applicant?.name || ""} />
            <Field label="Email" value={data.applicant?.email || ""} />
            <Field label="Phone" value={phoneLabel} />
            <Field label="Passport number" value={data.profile?.passportNumber || ""} />
            <Field label="National ID" value={data.profile?.nationalId || ""} />
          </dl>
          <p className="mt-4 text-ink-soft">Destination {kase.destinationCity}. Submitted {kase.submittedAt ? formatWhen(kase.submittedAt) : "not yet"}.</p>
        </section>
      )}
      {tab === "documents" && (
        <ul className="space-y-2">{data.documents.map((doc) => (
          <li key={doc.id} className="rounded-2xl bg-white p-4 text-sm">
            <div className="flex justify-between gap-2"><span className="font-semibold">{doc.fileName}</span><IntegrityBadge state={doc.tampered ? "tampered" : doc.source === "partner" ? "verified_source" : "verified"} /></div>
            <p className="text-ink-soft">{doc.contentType} · zoom placeholder · {doc.readable ? "readable" : "check quality"}</p>
          </li>
        ))}{data.documents.length === 0 && <li className="text-sm text-ink-soft">No documents yet.</li>}</ul>
      )}
      {tab === "identity" && <p className="rounded-2xl bg-white p-4 text-sm">{data.identity ? `${data.identity.provider}: ${data.identity.status} (${data.identity.matchScore ?? "—"})` : "No identity check yet."}</p>}
      {tab === "source" && (
        <section className="rounded-2xl bg-white p-4 text-sm">
          <h2 className="font-semibold">Internal rationale</h2>
          <p className="mt-2">{data.rating?.rationale || "No internal rationale yet. The analyst writes this while rating the case."}</p>
        </section>
      )}
      {tab === "tasks" && (
        <div className="space-y-2">
          <p className="text-sm text-ink-soft">Every case gets this checklist. Analysts tick the items here. The labels stay fixed.</p>
          <ul className="space-y-2">{data.tasks.map((task) => (
            <li key={task.id}><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={task.done} disabled={!canTick} onChange={() => { if (!canTick) return; void saveTask(kase.id, { ...task, done: !task.done }).then(() => query.mutate()); }} />{task.label}</label></li>
          ))}</ul>
        </div>
      )}
      {tab === "notes" && (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">Notes from analysts, reviewers, admins, and compliance are visible to every internal role.</p>
          <ul className="space-y-2">{data.notes.map((item) => <li key={item.id} className="rounded-2xl bg-white p-3 text-sm"><span className="font-semibold">{item.authorName}</span> <span className="text-ink-soft capitalize">@{item.authorRole}</span><p>{item.body}</p><p className="text-xs text-ink-soft">{formatWhen(item.createdAt)}</p></li>)}{data.notes.length === 0 && <p className="text-sm text-ink-soft">No notes yet.</p>}</ul>
          <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void addNote(kase.id, { authorId: session.user.id, authorName: session.user.name, authorRole: session.user.role, body: note }).then(() => { setNote(""); return query.mutate(); }); }}>
            <Textarea aria-label="Note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note. Use @name to mention a colleague." />
            <Button type="submit" disabled={note.trim().length < 2}>Add note</Button>
          </form>
        </div>
      )}
      {tab === "alerts" && (
        <div className="space-y-3">
          <ul className="space-y-2">{data.redFlags.map((flag) => <li key={flag.id}><Alert tone={flag.severity === "critical" ? "error" : "warning"} title={flag.title}>{flag.detail}</Alert></li>)}{data.redFlags.length === 0 && <p className="text-sm text-ink-soft">No red flags.</p>}</ul>
          <form className="space-y-2 rounded-2xl bg-white p-4" onSubmit={(event) => { event.preventDefault(); void flagCase(kase.id, flagTitle, flagDetail).then(() => { setFlagTitle(""); setFlagDetail(""); return query.mutate(); }); }}>
            <h2 className="text-sm font-semibold">Flag this case</h2>
            <Input aria-label="Flag title" value={flagTitle} onChange={(event) => setFlagTitle(event.target.value)} placeholder="Short title" />
            <Textarea aria-label="Flag detail" value={flagDetail} onChange={(event) => setFlagDetail(event.target.value)} placeholder="What should the team look at?" />
            <Button type="submit" disabled={flagTitle.trim().length < 3}>Add alert</Button>
          </form>
        </div>
      )}
      {tab === "timeline" && (
        <div className="space-y-4">
          <ul className="space-y-2 text-sm">{data.timeline.map((event) => <li key={event.id} className="rounded-2xl bg-white p-3"><strong>{event.title}</strong> · {event.actorName} · {formatWhen(event.at)}<p className="text-ink-soft">{event.detail}</p></li>)}{data.timeline.length === 0 && <li className="text-sm text-ink-soft">Nothing logged yet.</li>}</ul>
          <ChainOfCustody entries={data.ledger} />
        </div>
      )}
    </div>
  );
}
