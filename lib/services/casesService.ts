import type {
  Case,
  ConsentGrant,
  Document,
  Feedback,
  IdentityVerification,
  LedgerEntry,
  Note,
  Payment,
  Profile,
  QaReview,
  RatingAssessment,
  RedFlag,
  Report,
  SourceSummary,
  Task,
  TimelineEvent,
  User,
  WizardDraft,
} from "@/lib/types";
import { mergeById, readBag, upsert } from "@/lib/demo-db";
import { api } from "./api";
import { applyEffects } from "./effects";

type Effects = Parameters<typeof applyEffects>[0];

async function ledgerTail(): Promise<LedgerEntry | null> {
  const seed = await api<LedgerEntry[]>("/api/provenance/ledger");
  const merged = mergeById(seed, "ledger").sort((a, b) => a.index - b.index);
  return merged[merged.length - 1] ?? null;
}

export async function listCases(): Promise<Case[]> {
  const seed = await api<Case[]>("/api/cases");
  return mergeById(seed, "cases");
}

export async function getCase(id: string): Promise<Case> {
  const local = readBag<Case>("cases").upserts.find((item) => item.id === id || item.reference === id);
  if (readBag<Case>("cases").tombstones.includes(id)) throw new Error("Case not found.");
  try {
    const seed = await api<Case>(`/api/cases/${id}`);
    const merged = mergeById([seed], "cases").find((item) => item.id === seed.id);
    return merged ?? seed;
  } catch (error) {
    if (local) return local;
    throw error;
  }
}

export async function createCase(input: Partial<Case>): Promise<Case> {
  const data = await api<{ case: Case; timeline?: TimelineEvent }>("/api/cases", { method: "POST", body: JSON.stringify(input) });
  await applyEffects(data);
  return data.case;
}

export async function updateCase(id: string, patch: Partial<Case>): Promise<Case> {
  const base = await getCase(id);
  const data = await api<{ case: Case }>(`/api/cases/${id}`, { method: "PATCH", body: JSON.stringify({ base, patch }) });
  await applyEffects(data);
  return data.case;
}

export async function advanceCase(id: string): Promise<Case> {
  const base = await getCase(id);
  const data = await api<{ case: Case; timeline?: TimelineEvent }>(`/api/cases/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ base, advance: true }),
  });
  await applyEffects(data);
  return data.case;
}

export async function jumpCase(id: string, status: Case["status"]): Promise<Case> {
  const base = await getCase(id);
  const data = await api<Effects & { case: Case }>(`/api/cases/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ base, jumpTo: status }),
  });
  await applyEffects(data);
  return data.case;
}

export async function listDocuments(caseId: string): Promise<Document[]> {
  let seed: Document[] = [];
  try {
    seed = await api<Document[]>(`/api/cases/${caseId}/documents`);
  } catch {
    seed = [];
  }
  return mergeById(seed, "documents").filter((doc) => doc.caseId === caseId);
}

export async function addDocument(caseId: string, input: Record<string, unknown>): Promise<Document> {
  const base = await getCase(caseId).catch(() => undefined);
  const tail = await ledgerTail();
  const data = await api<Effects & { document: Document }>(`/api/cases/${caseId}/documents`, {
    method: "POST",
    body: JSON.stringify({ ...input, baseCase: base, ledgerTail: tail }),
  });
  await applyEffects(data);
  return data.document;
}

export async function verifyIdentity(caseId: string, phase: "start" | "complete" | "fail"): Promise<IdentityVerification> {
  const base = await getCase(caseId);
  const data = await api<{ identity: IdentityVerification; case?: Case }>(`/api/cases/${caseId}/identity-verification`, {
    method: "POST",
    body: JSON.stringify({ phase, base }),
  });
  await applyEffects(data);
  return data.identity;
}

export async function submitCase(caseId: string): Promise<Case> {
  const base = await getCase(caseId);
  const data = await api<Effects & { case: Case }>(`/api/cases/${caseId}/submit`, { method: "POST", body: JSON.stringify({ base }) });
  await applyEffects(data);
  return data.case;
}

export async function listTimeline(caseId: string): Promise<TimelineEvent[]> {
  let seed: TimelineEvent[] = [];
  try {
    seed = await api<TimelineEvent[]>(`/api/cases/${caseId}/timeline`);
  } catch {
    seed = [];
  }
  return mergeById(seed, "timeline").filter((event) => event.caseId === caseId).sort((a, b) => a.at.localeCompare(b.at));
}

export async function listNotes(caseId: string): Promise<Note[]> {
  let seed: Note[] = [];
  try {
    seed = await api<Note[]>(`/api/cases/${caseId}/notes`);
  } catch {
    seed = [];
  }
  return mergeById(seed, "notes").filter((note) => note.caseId === caseId);
}

export async function addNote(caseId: string, input: Pick<Note, "authorId" | "authorName" | "authorRole" | "body">): Promise<Note> {
  const note = await api<Note>(`/api/cases/${caseId}/notes`, { method: "POST", body: JSON.stringify(input) });
  upsert("notes", note);
  return note;
}

const CHECKLIST = [
  "Confirm identity document",
  "Check credit report date",
  "Review banking history",
  "Record factor scores",
  "Write customer feedback",
];

function ensureChecklist(caseId: string, tasks: Task[]): Task[] {
  if (tasks.length > 0) return tasks;
  const at = new Date().toISOString();
  return CHECKLIST.map((label, index) => {
    const task: Task = { id: `cl_task_${caseId}_${index}`, caseId, label, done: false, createdAt: at, updatedAt: at };
    upsert("tasks", task);
    return task;
  });
}

function mentioned(flags: RedFlag[], needle: string): boolean {
  return flags.some((flag) => `${flag.title} ${flag.detail}`.toLowerCase().includes(needle));
}

function autoFlag(caseId: string, key: string, severity: RedFlag["severity"], title: string, detail: string): RedFlag {
  const at = new Date().toISOString();
  return { id: `cl_flag_auto_${caseId}_${key}`, caseId, severity, title, detail, resolved: false, createdAt: at, updatedAt: at };
}

function withAutomaticFlags(input: {
  caseId: string;
  flags: RedFlag[];
  identity: IdentityVerification | null;
  documents: Document[];
  applicant: User | null;
  profile: Profile | null;
}): RedFlag[] {
  const next = [...input.flags];
  if (input.identity?.status === "failed" && !mentioned(next, "kyc") && !mentioned(next, "identity check")) {
    next.push(autoFlag(input.caseId, "kyc", "critical", "Failed KYC", "The identity check did not match the documents on file."));
  }
  const report = input.documents.find((doc) => doc.type === "credit_report");
  if (report && Date.now() - new Date(report.createdAt).getTime() > 30 * 24 * 3600_000 && !mentioned(next, "30") && !mentioned(next, "older")) {
    next.push(autoFlag(input.caseId, "age", "warning", "Report older than 30 days", "The foreign credit report on file is more than 30 days old."));
  }
  const profileName = input.profile?.fullName.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
  const signupName = input.applicant?.name.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
  if (profileName && signupName && profileName !== signupName && !mentioned(next, "name")) {
    next.push(autoFlag(input.caseId, "name", "warning", "Name mismatch", `Signup name “${input.applicant?.name}” does not match the profile name “${input.profile?.fullName}”.`));
  }
  return next;
}

function latestForCase<T extends { caseId: string; updatedAt: string }>(items: T[], caseId: string): T | null {
  return items.filter((item) => item.caseId === caseId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

function stamp(caseId: string, key: string, status: Case["status"], title: string, detail: string, at: string, actorName: string): TimelineEvent {
  return { id: `cl_tl_${caseId}_${key}`, caseId, status, title, detail, actorName, at, createdAt: at, updatedAt: at };
}

function withChronicle(input: {
  kase: Case;
  events: TimelineEvent[];
  documents: Document[];
  identity: IdentityVerification | null;
  payment: Payment | null;
  actorName: string;
}): TimelineEvent[] {
  const out = [...input.events];
  const has = (part: string) => out.some((event) => event.title.toLowerCase().includes(part));
  const { kase } = input;
  if (kase.status !== "draft" && !has("account")) {
    out.push(stamp(kase.id, "signup", "account_verified", "Account verified", "Signup confirmed the applicant profile.", kase.createdAt, input.actorName));
  }
  const firstDoc = [...input.documents].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  if (firstDoc && !has("upload") && !has("document")) {
    out.push(stamp(kase.id, "upload", "documents_uploaded", "Documents uploaded", `${firstDoc.fileName} is on file.`, firstDoc.createdAt, input.actorName));
  }
  if (input.identity?.status === "matched" && input.identity.checkedAt && !has("identity verified")) {
    out.push(stamp(kase.id, "identity", "identity_verified", "Identity verified", "The identity check matched the documents.", input.identity.checkedAt, input.actorName));
  }
  if (input.identity?.status === "failed" && input.identity.checkedAt && !has("failed")) {
    out.push(stamp(kase.id, "kyc", "identity_verified", "Identity check failed", "The identity check did not match.", input.identity.checkedAt, input.actorName));
  }
  if (input.payment?.status === "succeeded" && !has("payment")) {
    out.push(stamp(kase.id, "payment", "payment_received", "Payment received", "The assessment fee was paid.", input.payment.createdAt, input.actorName));
  }
  if (kase.assignedAnalystId && !has("assign")) {
    out.push(stamp(kase.id, "assign", kase.status, "Analyst assigned", "A reviewer assigned this case to an analyst.", kase.updatedAt, "Reviewer"));
  }
  const inReview = ["under_review", "quality_check", "finalized", "ready_to_download", "info_requested", "escalated", "rejected"].includes(kase.status);
  if (inReview && !has("review") && !has("quality") && !has("declined") && !has("escalat")) {
    out.push(stamp(kase.id, "review", "under_review", "Under review", "The case entered review.", kase.submittedAt ?? kase.updatedAt, "NOAHFI"));
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

export async function getWorkspace(caseId: string) {
  const seed = await api<{
    case: Case | null;
    documents: Document[];
    identity: IdentityVerification | null;
    notes: Note[];
    tasks: Task[];
    redFlags: RedFlag[];
    timeline: TimelineEvent[];
    rating: RatingAssessment | null;
    report: Report | null;
    feedback: Feedback | null;
    consents: ConsentGrant[];
    source: SourceSummary | null;
    ledger: LedgerEntry[];
    payment: Payment | null;
    applicant: User | null;
    profile: Profile | null;
    qa: QaReview | null;
  }>(`/api/cases/${caseId}/workspace`);
  const caseItem = seed.case ? (mergeById([seed.case], "cases").find((item) => item.id === seed.case!.id) ?? seed.case) : (await getCase(caseId).catch(() => null));
  const resolvedId = caseItem?.id ?? caseId;
  const documents = mergeById(seed.documents, "documents").filter((item) => item.caseId === resolvedId);
  const identity = mergeById(seed.identity ? [seed.identity] : [], "identity").find((item) => item.caseId === resolvedId) ?? null;
  const applicant = mergeById(seed.applicant ? [seed.applicant] : [], "users").find((item) => item.id === caseItem?.userId) ?? null;
  const profile = mergeById(seed.profile ? [seed.profile] : [], "profiles").find((item) => item.userId === caseItem?.userId) ?? null;
  const flags = mergeById(seed.redFlags, "redFlags").filter((item) => item.caseId === resolvedId);
  const payment = seed.payment ? (mergeById([seed.payment], "payments").find((item) => item.caseId === resolvedId) ?? null) : mergeById<Payment>([], "payments").find((item) => item.caseId === resolvedId) ?? null;
  const events = mergeById(seed.timeline, "timeline").filter((item) => item.caseId === resolvedId);
  return {
    case: caseItem,
    documents,
    identity,
    notes: mergeById(seed.notes, "notes").filter((item) => item.caseId === resolvedId),
    tasks: ensureChecklist(resolvedId, mergeById(seed.tasks, "tasks").filter((item) => item.caseId === resolvedId)),
    redFlags: withAutomaticFlags({ caseId: resolvedId, flags, identity, documents, applicant, profile }),
    timeline: caseItem ? withChronicle({ kase: caseItem, events, documents, identity, payment, actorName: applicant?.name ?? "Customer" }) : events,
    rating: latestForCase(mergeById(seed.rating ? [seed.rating] : [], "ratings"), resolvedId),
    report: latestForCase(mergeById(seed.report ? [seed.report] : [], "reports"), resolvedId),
    feedback: latestForCase(mergeById(seed.feedback ? [seed.feedback] : [], "feedback"), resolvedId),
    qa: mergeById(seed.qa ? [seed.qa] : [], "qa").find((item) => item.caseId === resolvedId) ?? null,
    applicant,
    profile,
    consents: mergeById(seed.consents, "consents").filter((item) => item.caseId === resolvedId),
    source: seed.source,
    ledger: mergeById(seed.ledger, "ledger").filter((item) => item.caseId === resolvedId),
    payment,
  };
}

export async function saveTask(caseId: string, task: Task): Promise<Task> {
  const saved = await api<Task>(`/api/cases/${caseId}/tasks`, { method: "POST", body: JSON.stringify(task) });
  upsert("tasks", saved);
  return saved;
}

export async function flagCase(caseId: string, title: string, detail: string, severity: RedFlag["severity"] = "warning"): Promise<RedFlag> {
  const data = await api<{ flag: RedFlag; timeline?: TimelineEvent }>(`/api/cases/${caseId}/flags`, {
    method: "POST",
    body: JSON.stringify({ title, detail, severity }),
  });
  upsert("redFlags", data.flag);
  if (data.timeline) upsert("timeline", data.timeline);
  return data.flag;
}

export async function getRating(caseId: string): Promise<RatingAssessment | null> {
  const seed = await api<RatingAssessment | null>(`/api/cases/${caseId}/rating`);
  const merged = mergeById(seed ? [seed] : [], "ratings");
  return merged.find((item) => item.caseId === caseId) ?? null;
}

export async function saveRating(caseId: string, rating: Partial<RatingAssessment> & { baseCase?: Case }): Promise<RatingAssessment> {
  const baseCase = rating.qaStatus === "submitted" ? (rating.baseCase ?? await getCase(caseId)) : rating.baseCase;
  const data = await api<{ rating: RatingAssessment; case?: Case }>(`/api/cases/${caseId}/rating`, {
    method: "PUT",
    body: JSON.stringify({ ...rating, baseCase }),
  });
  await applyEffects(data);
  return data.rating;
}

export async function assignCase(caseId: string, analystId: string, actor: Pick<User, "id" | "name" | "role">): Promise<Case> {
  const base = await getCase(caseId);
  const data = await api<Effects & { case: Case }>(`/api/cases/${caseId}/assign`, {
    method: "POST",
    body: JSON.stringify({ base, analystId, actorId: actor.id, actorName: actor.name }),
  });
  await applyEffects(data);
  return data.case;
}

export async function requestInfo(caseId: string, message: string, actor: Pick<User, "id" | "name" | "role">): Promise<Case> {
  const base = await getCase(caseId);
  const data = await api<Effects & { case: Case }>(`/api/cases/${caseId}/request-info`, {
    method: "POST",
    body: JSON.stringify({ base, message, actorId: actor.id, actorName: actor.name }),
  });
  await applyEffects(data);
  return data.case;
}

export async function decideCase(caseId: string, action: "approve" | "reject" | "escalate", reason: string, actor: Pick<User, "id" | "name" | "role">): Promise<Case> {
  const base = await getCase(caseId);
  const data = await api<Effects & { case: Case }>(`/api/cases/${caseId}/decision`, {
    method: "POST",
    body: JSON.stringify({ base, action, reason, actorId: actor.id, actorName: actor.name, actorRole: actor.role }),
  });
  await applyEffects(data);
  return data.case;
}

export async function submitQa(caseId: string, decision: "approve" | "revise" | "send_back" | "escalate", reason: string, actor: Pick<User, "id" | "name" | "role">): Promise<Case> {
  const base = await getCase(caseId);
  const data = await api<Effects & { case: Case }>(`/api/cases/${caseId}/qa`, {
    method: "POST",
    body: JSON.stringify({ base, decision, reason, actorId: actor.id, actorName: actor.name }),
  });
  await applyEffects(data);
  return data.case;
}

export async function sendFeedback(caseId: string, summary: string, visibleToPartner: boolean, actor: Pick<User, "id" | "name" | "role">, rating?: RatingAssessment): Promise<Case> {
  const base = await getCase(caseId);
  const tail = await ledgerTail();
  const data = await api<Effects & { case: Case }>(`/api/cases/${caseId}/feedback`, {
    method: "POST",
    body: JSON.stringify({ base, summary, visibleToPartner, actorId: actor.id, actorName: actor.name, rating, ledgerTail: tail }),
  });
  await applyEffects(data);
  return data.case;
}

export async function getReport(caseId: string): Promise<Report | null> {
  const seed = await api<Report | null>(`/api/cases/${caseId}/report`);
  return latestForCase(mergeById(seed ? [seed] : [], "reports"), caseId);
}

export async function shareCase(caseId: string, grants: { partnerId: string; scope: ConsentGrant["scope"]; granted: boolean; expiresAt: string | null }[], actorId: string): Promise<ConsentGrant[]> {
  const base = await getCase(caseId);
  const tail = await ledgerTail();
  const data = await api<{ grants: ConsentGrant[]; ledgerEntry?: LedgerEntry }>(`/api/cases/${caseId}/share`, {
    method: "POST",
    body: JSON.stringify({ base, grants, actorId, ledgerTail: tail }),
  });
  await applyEffects(data);
  return data.grants;
}

export async function loadDraft(userId: string): Promise<WizardDraft | null> {
  return readBag<WizardDraft>("drafts").upserts.find((item) => item.userId === userId) ?? null;
}

export async function saveDraft(draft: WizardDraft): Promise<void> {
  upsert("drafts", draft);
}

export async function listProfiles(): Promise<Profile[]> {
  const me = await api<{ profile: Profile | null }>("/api/users/me");
  return mergeById(me.profile ? [me.profile] : [], "profiles");
}
