import type {
  Case,
  CaseStatus,
  ConsentGrant,
  Document,
  EmailDraft,
  IdentityVerification,
  LedgerEntry,
  Note,
  Notification,
  RatingAssessment,
  RatingFactor,
  RedFlag,
  Session,
  Task,
  TimelineEvent,
  User,
} from "@/lib/types";
import {
  assignSchema,
  checkoutSchema,
  decisionSchema,
  documentCreateSchema,
  feedbackSendSchema,
  forgotSchema,
  loginSchema,
  noteCreateSchema,
  otpSchema,
  qaSchema,
  requestInfoSchema,
  shareSchema,
  signupSchema,
  uploadSchema,
  userRolePatchSchema,
  verifyHashSchema,
} from "@/lib/types/schemas";
import { cuid, nextReference, nowIso } from "@/lib/utils/id";
import { bandFor, luhnOk } from "@/lib/utils/format";
import { quoteFor } from "@/lib/utils/money";
import { nextStatus } from "@/lib/utils/status";
import { MAIN_TIMELINE, STATUS_LABEL } from "@/lib/utils/status";
import { blockMaterial } from "@/lib/trust/sha256";
import { createHash } from "node:crypto";
import { MockError, type MockCtx } from "./http";
import {
  publicUser,
  seedAudit,
  seedCases,
  seedCertificates,
  seedConsents,
  seedDocuments,
  seedEmails,
  seedFeedback,
  seedIdentity,
  seedIntegrations,
  seedInvoices,
  seedLedger,
  seedMetrics,
  seedNotes,
  seedNotifications,
  seedPartnerUsers,
  seedPartners,
  seedPayments,
  seedProfiles,
  seedQa,
  seedRatings,
  seedRedFlags,
  seedReports,
  seedSources,
  seedTasks,
  seedTimeline,
  seedUsers,
} from "./load";

const DEMO_OTP = "123456";

function sha256Sync(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function sessionFrom(req: Request): Session | null {
  const raw = req.headers.get("x-demo-session");
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as Session;
  } catch {
    return null;
  }
}

function overlayAccount(req: Request): (User & { password?: string }) | null {
  const raw = req.headers.get("x-demo-account");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as { user?: User; password?: string; email?: string };
    if (!parsed.user) return null;
    return { ...parsed.user, password: parsed.password };
  } catch {
    return null;
  }
}

function requireUser(ctx: MockCtx): Session["user"] {
  const session = sessionFrom(ctx.req);
  if (!session) throw new MockError(401, "unauthorized", "Sign in to continue.");
  return session.user;
}

function findUserByEmail(email: string, req: Request) {
  const seed = seedUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (seed) return seed;
  const overlay = overlayAccount(req);
  if (overlay && overlay.email.toLowerCase() === email.toLowerCase()) return overlay;
  return null;
}

function draft(to: string, template: EmailDraft["template"], props: Record<string, string>): EmailDraft {
  return { to, template, props };
}

function notify(userId: string, caseId: string | null, type: Notification["type"], title: string, body: string, href: string): Notification {
  const at = nowIso();
  return { id: cuid("nt"), userId, caseId, type, title, body, href, readAt: null, createdAt: at, updatedAt: at };
}

function touchCase(base: Case, patch: Partial<Case>): Case {
  return { ...base, ...patch, updatedAt: nowIso() };
}

function timeline(caseId: string, status: CaseStatus, title: string, detail: string, actorName: string): TimelineEvent {
  const at = nowIso();
  return { id: cuid("tl"), caseId, status, title, detail, actorName, at, createdAt: at, updatedAt: at };
}

function scoreFactors(input: {
  identityConfidence: number;
  documentValidity: number;
  bankingHistory: number;
  creditHistory: number;
  fraudRisk: number;
  consistency: number;
  identityNote?: string;
  documentNote?: string;
  bankingNote?: string;
  creditNote?: string;
  fraudNote?: string;
  consistencyNote?: string;
}): { computedScore: number; band: string; factors: RatingFactor[] } {
  const fraudPoints = 5 - Math.min(5, Math.max(0, input.fraudRisk));
  const parts = [input.identityConfidence, input.documentValidity, input.bankingHistory, input.creditHistory, fraudPoints, input.consistency];
  const avg = parts.reduce((sum, value) => sum + value, 0) / parts.length;
  const computedScore = Math.max(300, Math.min(900, Math.round(300 + (avg / 5) * 600)));
  const factors: RatingFactor[] = [
    { key: "identity", label: "Identity confidence", score: input.identityConfidence, max: 5, justification: input.identityNote ?? "" },
    { key: "documents", label: "Document validity", score: input.documentValidity, max: 5, justification: input.documentNote ?? "" },
    { key: "banking", label: "Banking history quality", score: input.bankingHistory, max: 5, justification: input.bankingNote ?? "" },
    { key: "credit", label: "Credit history quality", score: input.creditHistory, max: 5, justification: input.creditNote ?? "" },
    { key: "fraud", label: "Fraud risk flags", score: input.fraudRisk, max: 5, justification: input.fraudNote ?? "" },
    { key: "consistency", label: "Consistency checks", score: input.consistency, max: 5, justification: input.consistencyNote ?? "" },
  ];
  return { computedScore, band: bandFor(computedScore).label, factors };
}

function appendLedger(input: {
  tail: LedgerEntry | null;
  documentHash: string;
  documentId: string;
  caseId: string;
  actorId: string;
  actorRole: LedgerEntry["actorRole"];
  action: string;
}): LedgerEntry {
  const timestamp = nowIso();
  const previousHash = input.tail?.blockHash ?? seedLedger[seedLedger.length - 1]?.blockHash ?? "0".repeat(64);
  const index = (input.tail?.index ?? seedLedger[seedLedger.length - 1]?.index ?? -1) + 1;
  const blockHash = sha256Sync(blockMaterial(previousHash, input.documentHash, input.actorId, input.action, timestamp));
  return {
    id: cuid("led"),
    index,
    previousHash,
    documentHash: input.documentHash,
    documentId: input.documentId,
    caseId: input.caseId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.action,
    timestamp,
    blockHash,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function resolveCase(id: string, base?: Case): Case {
  if (base && (base.id === id || base.reference === id)) return base;
  const found = seedCases.find((item) => item.id === id || item.reference === id);
  if (!found) throw new MockError(404, "not_found", "Case not found.");
  return found;
}

export async function signup(ctx: MockCtx) {
  const input = signupSchema.parse(ctx.body);
  if (seedUsers.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
    throw new MockError(409, "exists", "An account with this email already exists.", { email: "This email is already registered." });
  }
  const at = nowIso();
  const user: User = {
    id: cuid("usr"),
    email: input.email,
    name: input.fullName,
    role: "customer",
    phone: input.phone,
    phoneCountry: input.phoneCountry,
    emailVerified: false,
    createdAt: at,
    updatedAt: at,
  };
  const profile = {
    id: cuid("prf"),
    userId: user.id,
    fullName: input.fullName,
    dateOfBirth: null,
    phone: input.phone,
    phoneCountry: input.phoneCountry,
    passportNumber: input.passportNumber,
    nationalId: input.nationalId,
    originCity: "",
    originCountry: input.phoneCountry,
    destinationCity: "Toronto",
    destinationCountry: "CA",
    createdAt: at,
    updatedAt: at,
  };
  return {
    user,
    profile,
    password: input.password,
    email: draft(user.email, "otp", { name: user.name, code: DEMO_OTP, href: `/verify-email?email=${encodeURIComponent(user.email)}` }),
  };
}

export async function verifyOtp(ctx: MockCtx) {
  const input = otpSchema.parse(ctx.body);
  if (input.code !== DEMO_OTP) throw new MockError(400, "bad_code", "That code is not correct.", { code: "That code is not correct." });
  const existing = findUserByEmail(input.email, ctx.req);
  if (!existing) throw new MockError(404, "not_found", "We could not find that account.");
  const { password: _password, ...safe } = existing;
  const user = { ...safe, emailVerified: true, updatedAt: nowIso() };
  return {
    user,
    email: draft(user.email, "welcome", { name: user.name, href: "/login" }),
  };
}

export async function resendOtp(ctx: MockCtx) {
  const input = forgotSchema.parse(ctx.body);
  const existing = findUserByEmail(input.email, ctx.req);
  const name = existing?.name ?? "there";
  return {
    email: draft(input.email, "otp", { name, code: DEMO_OTP, href: `/verify-email?email=${encodeURIComponent(input.email)}` }),
  };
}

export async function login(ctx: MockCtx) {
  const input = loginSchema.parse(ctx.body);
  const existing = findUserByEmail(input.email, ctx.req);
  if (!existing) throw new MockError(401, "invalid", "Email or password is incorrect.");
  if (input.code) {
    if (input.code !== DEMO_OTP) throw new MockError(401, "bad_code", "That code is not correct.");
  } else if (existing.password !== input.password) {
    throw new MockError(401, "invalid", "Email or password is incorrect.");
  }
  const { password: _password, ...safe } = existing;
  const session: Session = {
    user: { id: safe.id, email: safe.email, role: safe.role, name: safe.name },
    expiresAt: new Date(Date.now() + 12 * 3600_000).toISOString(),
  };
  return session;
}

export async function logout() {
  return { ok: true };
}

export async function session(ctx: MockCtx) {
  return sessionFrom(ctx.req);
}

export async function forgotPassword(ctx: MockCtx) {
  const input = forgotSchema.parse(ctx.body);
  const existing = findUserByEmail(input.email, ctx.req);
  return {
    ok: true,
    email: draft(input.email, "otp", {
      name: existing?.name ?? "there",
      code: "Use your password on the sign-in page. Demo reset link is ready.",
      href: "/login?reset=1",
    }),
  };
}

export async function me(ctx: MockCtx) {
  const actor = requireUser(ctx);
  const seed = seedUsers.find((user) => user.id === actor.id);
  const overlay = overlayAccount(ctx.req);
  const user = seed ? publicUser(seed) : overlay && overlay.id === actor.id ? (({ password: _password, ...safe }) => safe)(overlay) : actor;
  const profile = seedProfiles.find((item) => item.userId === user.id) ?? null;
  return { user, profile };
}

export async function patchMe(ctx: MockCtx) {
  const current = await me(ctx);
  const body = (ctx.body ?? {}) as { user?: Partial<User>; profile?: Partial<(typeof seedProfiles)[number]> };
  const user = { ...current.user, ...(body.user ?? {}), id: current.user.id, updatedAt: nowIso() };
  const profile = current.profile || body.profile
    ? { ...(current.profile ?? { id: cuid("prf"), userId: user.id, fullName: user.name, dateOfBirth: null, phone: user.phone, phoneCountry: user.phoneCountry, passportNumber: "", nationalId: "", originCity: "", originCountry: user.phoneCountry, destinationCity: "Toronto", destinationCountry: "CA", createdAt: nowIso() }), ...(body.profile ?? {}), userId: user.id, updatedAt: nowIso() }
    : null;
  return { user, profile };
}

export async function pricing(ctx: MockCtx) {
  return quoteFor(ctx.search.get("country") ?? "CA");
}

export async function listCases() {
  return seedCases;
}

export async function createCase(ctx: MockCtx) {
  const actor = requireUser(ctx);
  const body = (ctx.body ?? {}) as Partial<Case>;
  const at = nowIso();
  const created: Case = {
    id: cuid("case"),
    reference: nextReference(),
    userId: body.userId || actor.id,
    partnerId: null,
    status: "draft",
    country: body.country || "CA",
    countryName: body.countryName || "Canada",
    destinationCity: body.destinationCity || "Toronto",
    riskLevel: "low",
    priority: "normal",
    assignedAnalystId: null,
    assignedReviewerId: null,
    slaDueAt: new Date(Date.now() + 48 * 3600_000).toISOString(),
    submittedAt: null,
    createdAt: at,
    updatedAt: at,
  };
  return {
    case: created,
    timeline: timeline(created.id, "draft", "Draft started", "Assessment request started.", actor.name),
  };
}

export async function getCase(ctx: MockCtx) {
  return resolveCase(ctx.params.caseId);
}

export async function patchCase(ctx: MockCtx) {
  const body = (ctx.body ?? {}) as { base?: Case; patch?: Partial<Case>; advance?: boolean; jumpTo?: CaseStatus };
  const current = resolveCase(ctx.params.caseId, body.base);
  if (body.jumpTo) {
    const actor = requireUser(ctx);
    if (actor.role !== "admin") throw new MockError(403, "forbidden", "Only an admin can move a case to a chosen stage.");
    if (!MAIN_TIMELINE.some((stage) => stage.status === body.jumpTo)) throw new MockError(400, "invalid", "Choose a stage on the case timeline.");
    const status = body.jumpTo;
    const at = nowIso();
    const next = touchCase(current, { status, submittedAt: current.submittedAt ?? (status === "draft" ? null : at) });
    const needsScore = ["quality_check", "finalized", "ready_to_download"].includes(status);
    const summary = "Placeholder assessment. An admin moved this case forward, so this is not an analyst score, a quality review, or customer feedback.";
    const scored = needsScore ? scoreFactors({ identityConfidence: 3, documentValidity: 3, bankingHistory: 3, creditHistory: 3, fraudRisk: 1, consistency: 3 }) : null;
    const rating = scored ? {
      id: `cl_rate_placeholder_${next.id}`,
      caseId: next.id,
      identityConfidence: 3,
      documentValidity: 3,
      bankingHistory: 3,
      creditHistory: 3,
      fraudRisk: 1,
      consistency: 3,
      identityNote: "Placeholder.",
      documentNote: "Placeholder.",
      bankingNote: "Placeholder.",
      creditNote: "Placeholder.",
      fraudNote: "Placeholder.",
      consistencyNote: "Placeholder.",
      computedScore: 700,
      finalScore: 700,
      confidence: 70,
      band: bandFor(700).label,
      recommendation: "approve" as const,
      rationale: summary,
      qaStatus: "approved" as const,
      factors: scored.factors,
      createdAt: at,
      updatedAt: at,
    } : undefined;
    const report = status === "finalized" || status === "ready_to_download" ? {
      id: `cl_rpt_placeholder_${next.id}`,
      caseId: next.id,
      reference: next.reference,
      score: 700,
      band: bandFor(700).label,
      confidence: 70,
      summary,
      feedback: summary,
      visibleToPartner: false,
      factors: scored?.factors ?? [],
      createdAt: at,
      updatedAt: at,
    } : undefined;
    const feedback = report ? {
      id: `cl_fb_placeholder_${next.id}`,
      caseId: next.id,
      authorId: actor.id,
      summary,
      visibleToPartner: false,
      sentAt: status === "ready_to_download" ? at : null,
      createdAt: at,
      updatedAt: at,
    } : undefined;
    return {
      case: next,
      rating,
      report,
      feedback,
      timeline: timeline(next.id, status, "Stage set by admin", needsScore ? summary : `Moved to ${STATUS_LABEL[status]}.`, actor.name),
    };
  }
  if (body.advance) {
    const status = nextStatus(current.status);
    if (!status) throw new MockError(400, "terminal", "This case has no further stage.");
    const next = touchCase(current, { status, slaDueAt: status === "payment_received" ? current.slaDueAt : current.slaDueAt });
    return { case: next, timeline: timeline(next.id, status, "Stage advanced", `Moved to ${status.replaceAll("_", " ")}.`, "Demo control") };
  }
  const patch = body.patch ?? {};
  const next = touchCase(current, patch);
  if (patch.status && patch.status !== current.status) {
    return {
      case: next,
      timeline: timeline(next.id, next.status, STATUS_LABEL[next.status], `Status is now ${STATUS_LABEL[next.status]}.`, patch.status === "account_verified" ? "Customer" : "NOAHFI"),
    };
  }
  return { case: next };
}

export async function listDocuments(ctx: MockCtx) {
  return seedDocuments.filter((doc) => doc.caseId === ctx.params.caseId);
}

export async function createDocument(ctx: MockCtx) {
  const input = documentCreateSchema.parse(ctx.body);
  const at = nowIso();
  const document: Document = {
    id: cuid("doc"),
    caseId: ctx.params.caseId,
    type: input.type,
    fileName: input.fileName,
    sizeBytes: input.sizeBytes,
    contentType: input.contentType,
    sha256: input.sha256,
    ledgerHash: input.sha256,
    url: `blob://mock/${cuid("blob")}`,
    pathname: `uploads/${ctx.params.caseId}/${input.fileName}`,
    readable: input.readable,
    pagesDetected: input.pagesDetected,
    source: input.source,
    sourceLabel: input.sourceLabel ?? null,
    uploadedById: input.uploadedById,
    tampered: false,
    createdAt: at,
    updatedAt: at,
  };
  const body = ctx.body as { baseCase?: Case; ledgerTail?: LedgerEntry | null };
  const ledgerEntry = appendLedger({
    tail: body.ledgerTail ?? null,
    documentHash: document.sha256,
    documentId: document.id,
    caseId: document.caseId,
    actorId: input.uploadedById,
    actorRole: input.source === "partner" ? "partner" : "customer",
    action: "upload",
  });
  let caseResult: Case | undefined;
  if (body.baseCase && body.baseCase.status === "account_verified") {
    caseResult = touchCase(body.baseCase, { status: "documents_uploaded" });
  } else if (body.baseCase && body.baseCase.status === "draft") {
    caseResult = touchCase(body.baseCase, { status: "documents_uploaded" });
  }
  const owner = seedUsers.find((user) => user.id === (body.baseCase?.userId ?? input.uploadedById));
  const uploader = seedUsers.find((user) => user.id === input.uploadedById);
  return {
    document,
    ledgerEntry,
    case: caseResult,
    timeline: timeline(document.caseId, caseResult?.status ?? body.baseCase?.status ?? "documents_uploaded", "Documents uploaded", `${document.fileName} uploaded.`, uploader?.name ?? owner?.name ?? "Customer"),
    email: owner ? draft(owner.email, "documents_received", { name: owner.name, fileName: document.fileName, href: `/cases/${document.caseId}` }) : undefined,
    notification: notify(body.baseCase?.userId ?? input.uploadedById, document.caseId, "documents_received", "Documents received", `${document.fileName} is on file.`, `/cases/${document.caseId}`),
  };
}

export async function verifyIdentity(ctx: MockCtx) {
  const body = (ctx.body ?? {}) as { phase?: "start" | "complete" | "fail"; base?: Case };
  const at = nowIso();
  const phase = body.phase ?? "complete";
  const status = phase === "fail" ? "failed" : phase === "start" ? "pending" : "matched";
  const identity: IdentityVerification = {
    id: cuid("idv"),
    caseId: ctx.params.caseId,
    status,
    provider: "NOAHFI KYC (Sumsub-style placeholder)",
    matchScore: status === "matched" ? 0.96 : status === "failed" ? 0.41 : null,
    checkedAt: status === "pending" ? null : at,
    createdAt: at,
    updatedAt: at,
  };
  const caseResult = body.base && status === "matched" ? touchCase(body.base, { status: "identity_verified" }) : undefined;
  const owner = seedUsers.find((user) => user.id === body.base?.userId);
  const identityTimeline = status === "pending"
    ? undefined
    : timeline(
      ctx.params.caseId,
      caseResult?.status ?? body.base?.status ?? "identity_verified",
      status === "matched" ? "Identity verified" : "Identity check failed",
      status === "matched" ? "The identity check matched the documents." : "The identity check did not match.",
      owner?.name ?? "Customer",
    );
  return { identity, case: caseResult, timeline: identityTimeline };
}

export async function submitCase(ctx: MockCtx) {
  const body = (ctx.body ?? {}) as { base?: Case };
  const actor = requireUser(ctx);
  const current = resolveCase(ctx.params.caseId, body.base);
  const next = touchCase(current, { status: "identity_verified", submittedAt: current.submittedAt });
  return { case: next, timeline: timeline(next.id, "identity_verified", "Submitted for payment", "Documents and identity check are ready.", actor.name) };
}

export async function caseTimeline(ctx: MockCtx) {
  return seedTimeline.filter((event) => event.caseId === ctx.params.caseId);
}

export async function listNotes(ctx: MockCtx) {
  return seedNotes.filter((note) => note.caseId === ctx.params.caseId);
}

export async function createNote(ctx: MockCtx) {
  const input = noteCreateSchema.parse(ctx.body);
  const at = nowIso();
  const note: Note = { id: cuid("note"), caseId: ctx.params.caseId, ...input, createdAt: at, updatedAt: at };
  return note;
}

export async function assignCase(ctx: MockCtx) {
  const input = assignSchema.parse(ctx.body);
  const next = touchCase(input.base, { assignedAnalystId: input.analystId });
  const analyst = seedUsers.find((user) => user.id === input.analystId);
  return {
    case: next,
    timeline: timeline(next.id, next.status, "Analyst assigned", `Assigned to ${analyst?.name ?? "an analyst"}.`, input.actorName),
    audit: {
      id: cuid("aud"),
      actorId: input.actorId,
      actorName: input.actorName,
      actorRole: "reviewer" as const,
      action: "case.assigned",
      entityType: "case",
      entityId: next.id,
      detail: `Assigned to ${analyst?.name ?? input.analystId}.`,
      at: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  };
}

export async function requestInfo(ctx: MockCtx) {
  const input = requestInfoSchema.parse(ctx.body);
  const next = touchCase(input.base, { status: "info_requested" });
  const owner = seedUsers.find((user) => user.id === next.userId) ?? overlayAccount(ctx.req);
  return {
    case: next,
    timeline: timeline(next.id, "info_requested", "Information requested", input.message, input.actorName),
    notification: notify(next.userId, next.id, "info_requested", "More information requested", input.message, `/cases/${next.id}`),
    email: draft(owner?.email ?? "customer@example.com", "info_requested", { name: owner?.name ?? "there", message: input.message, reference: next.reference, href: `/cases/${next.id}` }),
  };
}

export async function decideCase(ctx: MockCtx) {
  const input = decisionSchema.parse(ctx.body);
  const status: CaseStatus = input.action === "approve" ? "quality_check" : input.action === "reject" ? "rejected" : "escalated";
  const next = touchCase(input.base, { status, assignedReviewerId: input.action === "approve" ? "cl_usr_isabelle" : input.base.assignedReviewerId });
  return {
    case: next,
    timeline: timeline(next.id, status, input.action === "approve" ? "Sent to quality check" : input.action === "reject" ? "Declined" : "Escalated", input.reason, input.actorName),
  };
}

export async function getRating(ctx: MockCtx) {
  return seedRatings.find((rating) => rating.caseId === ctx.params.caseId) ?? null;
}

export async function putRating(ctx: MockCtx) {
  const body = (ctx.body ?? {}) as Partial<RatingAssessment> & { baseCase?: Case };
  const scored = scoreFactors({
    identityConfidence: Number(body.identityConfidence ?? 3),
    documentValidity: Number(body.documentValidity ?? 3),
    bankingHistory: Number(body.bankingHistory ?? 3),
    creditHistory: Number(body.creditHistory ?? 3),
    fraudRisk: Number(body.fraudRisk ?? 0),
    consistency: Number(body.consistency ?? 3),
    identityNote: body.identityNote,
    documentNote: body.documentNote,
    bankingNote: body.bankingNote,
    creditNote: body.creditNote,
    fraudNote: body.fraudNote,
    consistencyNote: body.consistencyNote,
  });
  const finalScore = Number(body.finalScore ?? scored.computedScore);
  const at = nowIso();
  const rating: RatingAssessment = {
    id: body.id || cuid("rate"),
    caseId: ctx.params.caseId,
    identityConfidence: Number(body.identityConfidence ?? 3),
    documentValidity: Number(body.documentValidity ?? 3),
    bankingHistory: Number(body.bankingHistory ?? 3),
    creditHistory: Number(body.creditHistory ?? 3),
    fraudRisk: Number(body.fraudRisk ?? 0),
    consistency: Number(body.consistency ?? 3),
    identityNote: body.identityNote ?? "",
    documentNote: body.documentNote ?? "",
    bankingNote: body.bankingNote ?? "",
    creditNote: body.creditNote ?? "",
    fraudNote: body.fraudNote ?? "",
    consistencyNote: body.consistencyNote ?? "",
    computedScore: scored.computedScore,
    finalScore,
    confidence: Number(body.confidence ?? 80),
    band: bandFor(finalScore).label,
    recommendation: body.recommendation ?? "approve",
    rationale: body.rationale ?? "",
    qaStatus: body.qaStatus ?? "draft",
    factors: scored.factors,
    createdAt: body.createdAt ?? at,
    updatedAt: at,
  };
  const caseResult = body.baseCase && body.qaStatus === "submitted" ? touchCase(body.baseCase, { status: "quality_check" }) : undefined;
  const actor = sessionFrom(ctx.req);
  return {
    rating,
    case: caseResult,
    timeline: body.qaStatus === "submitted"
      ? timeline(rating.caseId, caseResult?.status ?? "quality_check", "Rating submitted", rating.rationale || "Analyst submitted the rating for quality review.", actor?.user.name ?? "Analyst")
      : undefined,
  };
}

export async function qaCase(ctx: MockCtx) {
  const input = qaSchema.parse(ctx.body);
  const status: CaseStatus =
    input.decision === "approve" ? "finalized" : input.decision === "escalate" ? "escalated" : "under_review";
  const next = touchCase(input.base, { status, assignedReviewerId: input.actorId });
  const at = nowIso();
  return {
    case: next,
    qa: { id: cuid("qa"), caseId: next.id, reviewerId: input.actorId, decision: input.decision, reason: input.reason, createdAt: at, updatedAt: at },
    timeline: timeline(next.id, status, "Quality review", input.reason, input.actorName),
  };
}

export async function sendFeedback(ctx: MockCtx) {
  const input = feedbackSendSchema.parse(ctx.body);
  const next = touchCase(input.base, { status: "ready_to_download" });
  const at = nowIso();
  const rating = input.rating;
  const factors = rating?.factors ?? [];
  const report = {
    id: cuid("rpt"),
    caseId: next.id,
    reference: next.reference,
    score: rating?.finalScore ?? 700,
    band: rating?.band ?? bandFor(rating?.finalScore ?? 700).label,
    confidence: rating?.confidence ?? 80,
    summary: input.summary,
    feedback: input.summary,
    visibleToPartner: input.visibleToPartner,
    factors,
    createdAt: at,
    updatedAt: at,
  };
  const feedback = {
    id: cuid("fb"),
    caseId: next.id,
    authorId: input.actorId,
    summary: input.summary,
    visibleToPartner: input.visibleToPartner,
    sentAt: at,
    createdAt: at,
    updatedAt: at,
  };
  const owner = seedUsers.find((user) => user.id === next.userId) ?? overlayAccount(ctx.req);
  const ledgerEntry = appendLedger({
    tail: (ctx.body as { ledgerTail?: LedgerEntry | null }).ledgerTail ?? null,
    documentHash: sha256Sync(input.summary),
    documentId: report.id,
    caseId: next.id,
    actorId: input.actorId,
    actorRole: "reviewer",
    action: "shared",
  });
  return {
    case: next,
    report,
    feedback,
    ledgerEntry,
    notification: notify(next.userId, next.id, "final_report_ready", "Final report ready", `Your report for ${next.reference} is ready to download.`, `/cases/${next.id}`),
    email: draft(owner?.email ?? "customer@example.com", "report_ready", { name: owner?.name ?? "there", reference: next.reference, href: `/cases/${next.id}` }),
    timeline: timeline(next.id, "ready_to_download", "Report sent", "The requester can download the report.", input.actorName),
  };
}

export async function getReport(ctx: MockCtx) {
  return seedReports.find((report) => report.caseId === ctx.params.caseId) ?? null;
}

export async function shareCase(ctx: MockCtx) {
  const input = shareSchema.parse(ctx.body);
  const at = nowIso();
  const grants: ConsentGrant[] = input.grants.map((grant) => ({
    id: cuid("con"),
    caseId: input.base.id,
    userId: input.base.userId,
    partnerId: grant.partnerId,
    scope: grant.scope,
    granted: grant.granted && grant.scope !== "none",
    grantedAt: grant.granted && grant.scope !== "none" ? at : null,
    expiresAt: grant.expiresAt,
    createdAt: at,
    updatedAt: at,
  }));
  const ledgerEntry = appendLedger({
    tail: (ctx.body as { ledgerTail?: LedgerEntry | null }).ledgerTail ?? null,
    documentHash: sha256Sync(JSON.stringify(grants.map((grant) => grant.partnerId + grant.scope))),
    documentId: input.base.id,
    caseId: input.base.id,
    actorId: input.actorId,
    actorRole: "customer",
    action: "shared",
  });
  return { grants, ledgerEntry };
}

export async function uploadBlob(ctx: MockCtx) {
  const input = uploadSchema.parse(ctx.body);
  const id = cuid("up");
  return {
    url: `blob://mock/${id}`,
    pathname: `uploads/${id}/${input.fileName}`,
    size: input.size,
    contentType: input.contentType,
    sha256: input.sha256,
  };
}

export async function checkout(ctx: MockCtx) {
  const input = checkoutSchema.parse(ctx.body);
  const digits = input.cardNumber.replace(/\D/g, "");
  if (!luhnOk(digits)) throw new MockError(400, "bad_card", "Card number is not valid.", { cardNumber: "Check the card number." });
  if (digits === "4000000000000002") throw new MockError(402, "declined", "The card was declined. Try the success test card.", { cardNumber: "This test card is declined." });
  if (digits !== "4242424242424242") throw new MockError(400, "test_card", "Use a demo test card.", { cardNumber: "Use 4242 4242 4242 4242." });
  const quote = quoteFor(input.country);
  const at = nowIso();
  const payment = {
    id: cuid("pay"),
    caseId: input.caseId,
    userId: input.userId,
    amountUsd: quote.baseUsd,
    taxUsd: quote.taxUsd,
    totalUsd: quote.totalUsd,
    currency: quote.currency,
    totalLocal: quote.totalLocal,
    country: quote.country,
    status: "pending" as const,
    last4: digits.slice(-4),
    createdAt: at,
    updatedAt: at,
  };
  return { payment, quote };
}

export async function confirmPayment(ctx: MockCtx) {
  const body = (ctx.body ?? {}) as { payment?: { id: string; caseId: string; userId: string; amountUsd: number; taxUsd: number; totalUsd: number; currency: string; totalLocal: number; country: string; last4: string }; base?: Case; taxName?: string };
  if (!body.payment) throw new MockError(400, "missing", "Payment is missing.");
  const at = nowIso();
  const payment = { ...body.payment, status: "succeeded" as const, updatedAt: at, createdAt: body.payment.id ? at : at };
  const invoice = {
    id: cuid("inv"),
    paymentId: payment.id,
    caseId: payment.caseId,
    userId: payment.userId,
    number: `INV-2026-${String(2000 + Math.floor(Math.random() * 7000)).padStart(4, "0")}`,
    amountUsd: payment.amountUsd,
    taxUsd: payment.taxUsd,
    taxName: body.taxName ?? "Tax",
    totalUsd: payment.totalUsd,
    currency: payment.currency,
    totalLocal: payment.totalLocal,
    issuedAt: at,
    createdAt: at,
    updatedAt: at,
  };
  const current = body.base ?? resolveCase(payment.caseId);
  const due = new Date(Date.now() + 48 * 3600_000).toISOString();
  const next = touchCase(current, { status: "under_review", submittedAt: at, slaDueAt: due, priority: "normal" });
  const owner = seedUsers.find((user) => user.id === payment.userId) ?? overlayAccount(ctx.req);
  return {
    payment,
    invoice,
    case: next,
    notification: notify(payment.userId, payment.caseId, "payment_confirmed", "Payment confirmed", `We received payment for ${next.reference}. Result within 48 hours.`, `/requests/${next.id}/confirmation`),
    reviewNotification: notify(payment.userId, payment.caseId, "case_under_review", "Case under review", `${next.reference} is with an analyst.`, `/cases/${next.id}`),
    email: draft(owner?.email ?? "customer@example.com", "payment_receipt", {
      name: owner?.name ?? "there",
      reference: next.reference,
      total: String(payment.totalUsd),
      href: `/requests/${next.id}/confirmation`,
    }),
    timeline: timeline(next.id, "under_review", "Payment received", "The 48-hour review window has started.", owner?.name ?? "Customer"),
  };
}

export async function getInvoice(ctx: MockCtx) {
  const invoice = seedInvoices.find((item) => item.id === ctx.params.invoiceId);
  if (!invoice) throw new MockError(404, "not_found", "Invoice not found.");
  return invoice;
}

export async function listNotifications() {
  return seedNotifications;
}

export async function readNotification(ctx: MockCtx) {
  const body = (ctx.body ?? {}) as { base?: Notification };
  const seed = seedNotifications.find((item) => item.id === ctx.params.id);
  const current = body.base ?? seed;
  if (!current) throw new MockError(404, "not_found", "Notification not found.");
  const at = nowIso();
  return { ...current, readAt: at, updatedAt: at };
}

export async function listEmails() {
  return seedEmails;
}

export async function partnerMe(ctx: MockCtx) {
  const actor = requireUser(ctx);
  const link = seedPartnerUsers.find((item) => item.userId === actor.id) ?? seedPartnerUsers[0];
  const partner = seedPartners.find((item) => item.id === link.partnerId) ?? seedPartners[0];
  return { partner, partnerUser: link, user: actor };
}

export async function partnerCases() {
  return seedCases.filter((item) => item.status !== "draft");
}

export async function partnerEvidence(ctx: MockCtx) {
  const body = ctx.body as { sourceLabel?: string };
  return createDocument({
    ...ctx,
    body: { ...(ctx.body as object), source: "partner", sourceLabel: body.sourceLabel ?? "Maple Harbour Bank" },
  });
}

export async function listConsents() {
  return seedConsents;
}

export async function putConsents(ctx: MockCtx) {
  const body = (ctx.body ?? {}) as { grants?: ConsentGrant[] };
  return { grants: body.grants ?? [] };
}

export async function listIntegrations() {
  return seedIntegrations;
}

export async function queue() {
  return {
    cases: seedCases,
    users: seedUsers.map(publicUser),
    partners: seedPartners,
    analysts: seedUsers.filter((user) => user.role === "analyst" || user.role === "reviewer").map(publicUser),
  };
}

export async function analysts() {
  return seedUsers.filter((user) => user.role === "analyst" || user.role === "reviewer" || user.role === "admin" || user.role === "compliance").map(publicUser);
}

export async function metrics() {
  return seedMetrics;
}

export async function auditLogs() {
  return seedAudit;
}

export async function internalUsers() {
  return seedUsers.map(publicUser);
}

export async function patchInternalUser(ctx: MockCtx) {
  const actor = requireUser(ctx);
  if (actor.role !== "admin") throw new MockError(403, "forbidden", "Only an admin can change roles.");
  const input = userRolePatchSchema.parse(ctx.body);
  const seed = seedUsers.find((user) => user.id === ctx.params.id);
  const overlay = overlayAccount(ctx.req);
  const base = seed ? publicUser(seed) : overlay && overlay.id === ctx.params.id ? overlay : null;
  if (!base) throw new MockError(404, "not_found", "User not found.");
  return { ...base, role: input.role, updatedAt: nowIso() };
}

export async function provenanceDocument(ctx: MockCtx) {
  const document = seedDocuments.find((item) => item.id === ctx.params.documentId);
  if (!document) throw new MockError(404, "not_found", "Document not found.");
  return { document, entries: seedLedger.filter((entry) => entry.documentId === document.id) };
}

export async function provenanceVerify(ctx: MockCtx) {
  const input = verifyHashSchema.parse(ctx.body);
  const hash = input.hash.trim().toLowerCase();
  const entry = seedLedger.find((item) => item.documentHash === hash);
  if (!entry) return { result: "not_found" as const, entry: null };
  return { result: "verified" as const, entry };
}

export async function certificate(ctx: MockCtx) {
  const existing = seedCertificates.find((item) => item.caseId === ctx.params.caseId);
  if (existing) return existing;
  const related = seedLedger.filter((entry) => entry.caseId === ctx.params.caseId);
  const docs = seedDocuments.filter((doc) => doc.caseId === ctx.params.caseId);
  const kase = seedCases.find((item) => item.id === ctx.params.caseId);
  if (!related.length && !kase) throw new MockError(404, "not_found", "Certificate not found.");
  const at = nowIso();
  return {
    id: cuid("cert"),
    caseId: ctx.params.caseId,
    reference: kase?.reference ?? ctx.params.caseId,
    ledgerFrom: related[0]?.index ?? 0,
    ledgerTo: related[related.length - 1]?.index ?? 0,
    documentHashes: docs.map((doc) => ({ fileName: doc.fileName, sha256: doc.sha256 })),
    issuedAt: at,
    createdAt: at,
    updatedAt: at,
  };
}

export async function listProfiles() {
  return seedProfiles;
}

export async function bundle(ctx: MockCtx) {
  const id = ctx.params.caseId;
  const kase = seedCases.find((item) => item.id === id || item.reference === id) ?? null;
  const owner = kase ? seedUsers.find((user) => user.id === kase.userId) : undefined;
  return {
    case: kase,
    documents: seedDocuments.filter((item) => item.caseId === id),
    identity: seedIdentity.find((item) => item.caseId === id) ?? null,
    notes: seedNotes.filter((item) => item.caseId === id),
    tasks: seedTasks.filter((item) => item.caseId === id),
    redFlags: seedRedFlags.filter((item) => item.caseId === id),
    timeline: seedTimeline.filter((item) => item.caseId === id),
    rating: seedRatings.find((item) => item.caseId === id) ?? null,
    report: seedReports.find((item) => item.caseId === id) ?? null,
    feedback: seedFeedback.find((item) => item.caseId === id) ?? null,
    consents: seedConsents.filter((item) => item.caseId === id),
    source: seedSources.find((item) => item.caseId === id) ?? null,
    ledger: seedLedger.filter((item) => item.caseId === id),
    payment: seedPayments.find((item) => item.caseId === id) ?? null,
    applicant: owner ? publicUser(owner) : null,
    profile: owner ? seedProfiles.find((item) => item.userId === owner.id) ?? null : null,
    qa: seedQa.find((item) => item.caseId === id) ?? null,
  };
}

export async function listLedger() {
  return seedLedger;
}

export async function listTasks() {
  return seedTasks;
}

export async function listRedFlags() {
  return seedRedFlags;
}

export async function listSources() {
  return seedSources;
}

export async function createFlag(ctx: MockCtx) {
  const actor = requireUser(ctx);
  if (!["analyst", "reviewer", "admin", "compliance"].includes(actor.role)) {
    throw new MockError(403, "forbidden", "Only internal staff can flag a case.");
  }
  const body = (ctx.body ?? {}) as { title?: string; detail?: string; severity?: string };
  const title = body.title?.trim() ?? "";
  if (title.length < 3) throw new MockError(400, "invalid", "Give the flag a short title.");
  const at = nowIso();
  const flag: RedFlag = {
    id: cuid("flg"),
    caseId: ctx.params.caseId,
    severity: body.severity === "critical" ? "critical" : "warning",
    title,
    detail: body.detail?.trim() || "Flagged by staff.",
    resolved: false,
    createdAt: at,
    updatedAt: at,
  };
  return {
    flag,
    timeline: timeline(ctx.params.caseId, "under_review", "Alert flagged", title, actor.name),
  };
}

export async function saveTask(ctx: MockCtx) {
  const body = (ctx.body ?? {}) as Task;
  const at = nowIso();
  return { ...body, caseId: ctx.params.caseId, updatedAt: at, createdAt: body.createdAt ?? at };
}
