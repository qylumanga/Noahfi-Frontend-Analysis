"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Skeleton, StatusTag } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/fields";
import { Modal } from "@/components/ui/overlay";
import { Tabs } from "@/components/ui/data";
import { usePolling } from "@/lib/hooks/usePolling";
import { useSession } from "@/lib/hooks/useSession";
import { getQueue } from "@/lib/services/internalService";
import { addNote, decideCase, getWorkspace, requestInfo, saveTask } from "@/lib/services/casesService";
import { ChainOfCustody } from "@/components/trust/ChainOfCustody";
import { IntegrityBadge } from "@/components/trust/IntegrityBadge";
import { can } from "@/lib/utils/status";
import { formatWhen } from "@/lib/utils/format";

export function Workspace({ caseId }: { caseId: string }) {
  const { session } = useSession();
  const query = usePolling(`ws-${caseId}`, () => getWorkspace(caseId), { intervalMs: 8000 });
  const people = usePolling("queue-people", getQueue, { intervalMs: 20000 });
  const [tab, setTab] = useState("applicant");
  const [note, setNote] = useState("");
  const [modal, setModal] = useState<"info" | "approve" | "reject" | "escalate" | null>(null);
  const [reason, setReason] = useState("");
  const [analyst, setAnalyst] = useState("");
  const data = query.data;
  const kase = data?.case;
  const role = session?.user.role;
  const readOnly = role === "compliance";

  if (query.isLoading) return <Skeleton className="h-64" />;
  if (query.error || !kase || !session) return <Alert tone="error" title="Case unavailable"><button type="button" className="underline" onClick={() => void query.mutate()}>Retry</button></Alert>;

  async function act() {
    if (!modal || !session) return;
    if (modal === "info") await requestInfo(kase!.id, reason, session.user);
    else await decideCase(kase!.id, modal, reason, session.user);
    setModal(null);
    setReason("");
    await query.mutate();
  }

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
      <div className="flex flex-wrap gap-2 text-sm">
        <Link className="underline" href={`/internal/cases/${kase.id}/rating`}>Rating</Link>
        {role && can(role, "qa") && <Link className="underline" href={`/internal/cases/${kase.id}/qa`}>QA</Link>}
        {role && can(role, "feedback") && <Link className="underline" href={`/internal/cases/${kase.id}/feedback`}>Feedback</Link>}
      </div>
      <Tabs tabs={[{ id: "applicant", label: "Applicant" }, { id: "documents", label: "Documents" }, { id: "identity", label: "Identity" }, { id: "source", label: "Source data" }, { id: "tasks", label: "Tasks" }, { id: "notes", label: "Notes" }, { id: "alerts", label: "Alerts" }, { id: "timeline", label: "Timeline" }]} value={tab} onChange={setTab} />
      {tab === "applicant" && <p className="rounded-2xl bg-white p-4 text-sm">Destination {kase.destinationCity}. Submitted {kase.submittedAt ? formatWhen(kase.submittedAt) : "not yet"}.</p>}
      {tab === "documents" && (
        <ul className="space-y-2">{data.documents.map((doc) => (
          <li key={doc.id} className="rounded-2xl bg-white p-4 text-sm">
            <div className="flex justify-between gap-2"><span className="font-semibold">{doc.fileName}</span><IntegrityBadge state={doc.tampered ? "tampered" : doc.source === "partner" ? "verified_source" : "verified"} /></div>
            <p className="text-ink-soft">{doc.contentType} · zoom placeholder · {doc.readable ? "readable" : "check quality"}</p>
          </li>
        ))}</ul>
      )}
      {tab === "identity" && <p className="rounded-2xl bg-white p-4 text-sm">{data.identity ? `${data.identity.provider}: ${data.identity.status} (${data.identity.matchScore ?? "—"})` : "No identity check yet."}</p>}
      {tab === "source" && <p className="rounded-2xl bg-white p-4 text-sm">{data.source ? `${data.source.bureau} ${data.source.bureauScore}. ${data.source.yearsOfHistory} years, utilisation ${data.source.utilizationPct}%. ${data.source.notes}` : "No structured source file yet."}</p>}
      {tab === "tasks" && (
        <ul className="space-y-2">{data.tasks.map((task) => (
          <li key={task.id}><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={task.done} disabled={readOnly} onChange={() => void saveTask(kase.id, { ...task, done: !task.done }).then(() => query.mutate())} />{task.label}</label></li>
        ))}{data.tasks.length === 0 && <li className="text-sm text-ink-soft">No checklist on this case.</li>}</ul>
      )}
      {tab === "notes" && (
        <div className="space-y-3">
          <ul className="space-y-2">{data.notes.map((item) => <li key={item.id} className="rounded-2xl bg-white p-3 text-sm"><span className="font-semibold">{item.authorName}</span> <span className="text-ink-soft">@{item.authorRole}</span><p>{item.body}</p><p className="text-xs text-ink-soft">{formatWhen(item.createdAt)}</p></li>)}</ul>
          {!readOnly && (
            <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void addNote(kase.id, { authorId: session.user.id, authorName: session.user.name, authorRole: session.user.role, body: note }).then(() => { setNote(""); return query.mutate(); }); }}>
              <Textarea aria-label="Note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note. Use @name to mention a colleague." />
              <Button type="submit">Add note</Button>
            </form>
          )}
        </div>
      )}
      {tab === "alerts" && (
        <ul className="space-y-2">{data.redFlags.map((flag) => <li key={flag.id}><Alert tone={flag.severity === "critical" ? "error" : "warning"} title={flag.title}>{flag.detail}</Alert></li>)}{data.redFlags.length === 0 && <p className="text-sm text-ink-soft">No red flags.</p>}</ul>
      )}
      {tab === "timeline" && (
        <div className="space-y-4">
          <ul className="space-y-2 text-sm">{data.timeline.map((event) => <li key={event.id}><strong>{event.title}</strong> · {event.actorName} · {formatWhen(event.at)}</li>)}</ul>
          <ChainOfCustody entries={data.ledger} />
        </div>
      )}
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          {role && can(role, "assign") && (
            <>
              <Select aria-label="Assign analyst" value={analyst} onChange={(event) => setAnalyst(event.target.value)}>
                <option value="">Assign analyst</option>
                {(people.data?.analysts ?? []).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
              </Select>
              <Button type="button" variant="secondary" disabled={!analyst} onClick={() => void import("@/lib/services/casesService").then(({ assignCase }) => assignCase(kase.id, analyst, session.user)).then(() => query.mutate())}>Assign</Button>
            </>
          )}
          <Button type="button" variant="secondary" onClick={() => setModal("info")}>Request information</Button>
          <Button type="button" onClick={() => setModal("approve")}>Approve</Button>
          <Button type="button" variant="danger" onClick={() => setModal("reject")}>Reject</Button>
          <Button type="button" variant="secondary" onClick={() => setModal("escalate")}>Escalate</Button>
        </div>
      )}
      <Modal open={!!modal} title="Confirm action" onClose={() => setModal(null)}>
        <Textarea aria-label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason (required)" />
        <Button className="mt-3" type="button" disabled={reason.trim().length < 3} onClick={() => void act()}>Confirm</Button>
      </Modal>
    </div>
  );
}
