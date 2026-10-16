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
  }>(`/api/cases/${caseId}/workspace`);
  const caseItem = seed.case ? (mergeById([seed.case], "cases").find((item) => item.id === seed.case!.id) ?? seed.case) : (await getCase(caseId).catch(() => null));
  const resolvedId = caseItem?.id ?? caseId;
  return {
    case: caseItem,
    documents: mergeById(seed.documents, "documents").filter((item) => item.caseId === resolvedId),
    identity: mergeById(seed.identity ? [seed.identity] : [], "identity").find((item) => item.caseId === resolvedId) ?? null,
    notes: mergeById(seed.notes, "notes").filter((item) => item.caseId === resolvedId),
    tasks: mergeById(seed.tasks, "tasks").filter((item) => item.caseId === resolvedId),
    redFlags: mergeById(seed.redFlags, "redFlags").filter((item) => item.caseId === resolvedId),
    timeline: mergeById(seed.timeline, "timeline").filter((item) => item.caseId === resolvedId),
    rating: mergeById(seed.rating ? [seed.rating] : [], "ratings").find((item) => item.caseId === resolvedId) ?? null,
    report: mergeById(seed.report ? [seed.report] : [], "reports").find((item) => item.caseId === resolvedId) ?? null,
    feedback: mergeById(seed.feedback ? [seed.feedback] : [], "feedback").find((item) => item.caseId === resolvedId) ?? null,
    consents: mergeById(seed.consents, "consents").filter((item) => item.caseId === resolvedId),
    source: seed.source,
    ledger: mergeById(seed.ledger, "ledger").filter((item) => item.caseId === resolvedId),
    payment: seed.payment ? (mergeById([seed.payment], "payments").find((item) => item.caseId === resolvedId) ?? null) : mergeById<Payment>([], "payments").find((item) => item.caseId === resolvedId) ?? null,
  };
}

export async function saveTask(caseId: string, task: Task): Promise<Task> {
  const saved = await api<Task>(`/api/cases/${caseId}/tasks`, { method: "POST", body: JSON.stringify(task) });
  upsert("tasks", saved);
  return saved;
}

export async function getRating(caseId: string): Promise<RatingAssessment | null> {
  const seed = await api<RatingAssessment | null>(`/api/cases/${caseId}/rating`);
  const merged = mergeById(seed ? [seed] : [], "ratings");
  return merged.find((item) => item.caseId === caseId) ?? null;
}

export async function saveRating(caseId: string, rating: Partial<RatingAssessment> & { baseCase?: Case }): Promise<RatingAssessment> {
  const data = await api<{ rating: RatingAssessment; case?: Case }>(`/api/cases/${caseId}/rating`, {
    method: "PUT",
    body: JSON.stringify(rating),
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
  return mergeById(seed ? [seed] : [], "reports").find((item) => item.caseId === caseId) ?? null;
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
