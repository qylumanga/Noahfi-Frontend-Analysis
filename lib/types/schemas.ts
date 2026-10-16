import { z } from "zod";

const id = z.string().min(4);
const iso = z.string().datetime({ offset: true }).or(z.string().datetime());

export const roleSchema = z.enum(["customer", "partner", "analyst", "reviewer", "admin", "compliance"]);

export const caseStatusSchema = z.enum([
  "draft",
  "account_verified",
  "documents_uploaded",
  "identity_verified",
  "payment_received",
  "under_review",
  "quality_check",
  "finalized",
  "ready_to_download",
  "info_requested",
  "escalated",
  "rejected",
]);

export const documentTypeSchema = z.enum([
  "passport",
  "credit_report",
  "banking_evidence",
  "selfie",
  "partner_evidence",
]);

const timestamps = { createdAt: iso, updatedAt: iso };

export const userSchema = z.object({
  id,
  email: z.string().email(),
  name: z.string().min(1),
  role: roleSchema,
  phone: z.string().default(""),
  phoneCountry: z.string().default("CA"),
  emailVerified: z.boolean(),
  ...timestamps,
});

export const sessionSchema = z.object({
  user: z.object({
    id,
    email: z.string().email(),
    role: roleSchema,
    name: z.string(),
  }),
  expiresAt: iso,
});

export const profileSchema = z.object({
  id,
  userId: id,
  fullName: z.string(),
  dateOfBirth: z.string().nullable(),
  phone: z.string(),
  phoneCountry: z.string(),
  passportNumber: z.string(),
  nationalId: z.string(),
  originCity: z.string(),
  originCountry: z.string(),
  destinationCity: z.string(),
  destinationCountry: z.string(),
  ...timestamps,
});

export const caseSchema = z.object({
  id,
  reference: z.string(),
  userId: id,
  partnerId: z.string().nullable(),
  status: caseStatusSchema,
  country: z.string(),
  countryName: z.string(),
  destinationCity: z.string(),
  riskLevel: z.enum(["low", "medium", "high"]),
  priority: z.enum(["normal", "high", "urgent"]),
  assignedAnalystId: z.string().nullable(),
  assignedReviewerId: z.string().nullable(),
  slaDueAt: iso,
  submittedAt: z.string().nullable(),
  ...timestamps,
});

export const documentSchema = z.object({
  id,
  caseId: id,
  type: documentTypeSchema,
  fileName: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  contentType: z.string(),
  sha256: z.string(),
  ledgerHash: z.string(),
  url: z.string(),
  pathname: z.string(),
  readable: z.boolean(),
  pagesDetected: z.boolean(),
  source: z.enum(["customer", "partner"]),
  sourceLabel: z.string().nullable(),
  uploadedById: id,
  tampered: z.boolean(),
  ...timestamps,
});

export const identityVerificationSchema = z.object({
  id,
  caseId: id,
  status: z.enum(["pending", "matched", "failed"]),
  provider: z.string(),
  matchScore: z.number().nullable(),
  checkedAt: z.string().nullable(),
  ...timestamps,
});

export const paymentSchema = z.object({
  id,
  caseId: id,
  userId: id,
  amountUsd: z.number(),
  taxUsd: z.number(),
  totalUsd: z.number(),
  currency: z.string(),
  totalLocal: z.number(),
  country: z.string(),
  status: z.enum(["pending", "succeeded", "failed"]),
  last4: z.string(),
  ...timestamps,
});

export const invoiceSchema = z.object({
  id,
  paymentId: id,
  caseId: id,
  userId: id,
  number: z.string(),
  amountUsd: z.number(),
  taxUsd: z.number(),
  taxName: z.string(),
  totalUsd: z.number(),
  currency: z.string(),
  totalLocal: z.number(),
  issuedAt: iso,
  ...timestamps,
});

export const notificationSchema = z.object({
  id,
  userId: id,
  caseId: z.string().nullable(),
  type: z.enum(["otp_sent", "documents_received", "payment_confirmed", "case_under_review", "final_report_ready", "info_requested"]),
  title: z.string(),
  body: z.string(),
  href: z.string(),
  readAt: z.string().nullable(),
  ...timestamps,
});

export const ratingFactorSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number(),
  max: z.number(),
  justification: z.string(),
});

export const ratingAssessmentSchema = z.object({
  id,
  caseId: id,
  identityConfidence: z.number(),
  documentValidity: z.number(),
  bankingHistory: z.number(),
  creditHistory: z.number(),
  fraudRisk: z.number(),
  consistency: z.number(),
  identityNote: z.string(),
  documentNote: z.string(),
  bankingNote: z.string(),
  creditNote: z.string(),
  fraudNote: z.string(),
  consistencyNote: z.string(),
  computedScore: z.number(),
  finalScore: z.number(),
  confidence: z.number(),
  band: z.string(),
  recommendation: z.enum(["approve", "approve_with_conditions", "request_info", "decline"]),
  rationale: z.string(),
  qaStatus: z.enum(["draft", "submitted", "approved", "revised", "sent_back"]),
  factors: z.array(ratingFactorSchema),
  ...timestamps,
});

export const qaReviewSchema = z.object({
  id,
  caseId: id,
  reviewerId: id,
  decision: z.enum(["approve", "revise", "send_back", "escalate"]),
  reason: z.string(),
  ...timestamps,
});

export const feedbackSchema = z.object({
  id,
  caseId: id,
  authorId: id,
  summary: z.string(),
  visibleToPartner: z.boolean(),
  sentAt: z.string().nullable(),
  ...timestamps,
});

export const reportSchema = z.object({
  id,
  caseId: id,
  reference: z.string(),
  score: z.number(),
  band: z.string(),
  confidence: z.number(),
  summary: z.string(),
  feedback: z.string(),
  visibleToPartner: z.boolean(),
  factors: z.array(ratingFactorSchema),
  ...timestamps,
});

export const noteSchema = z.object({
  id,
  caseId: id,
  authorId: id,
  authorName: z.string(),
  authorRole: roleSchema,
  body: z.string(),
  ...timestamps,
});

export const taskSchema = z.object({
  id,
  caseId: id,
  label: z.string(),
  done: z.boolean(),
  ...timestamps,
});

export const redFlagSchema = z.object({
  id,
  caseId: id,
  severity: z.enum(["info", "warning", "critical"]),
  title: z.string(),
  detail: z.string(),
  resolved: z.boolean(),
  ...timestamps,
});

export const timelineEventSchema = z.object({
  id,
  caseId: id,
  status: caseStatusSchema,
  title: z.string(),
  detail: z.string(),
  actorName: z.string(),
  at: iso,
  ...timestamps,
});

export const partnerSchema = z.object({
  id,
  name: z.string(),
  shortName: z.string(),
  city: z.string(),
  status: z.enum(["active", "pending"]),
  ...timestamps,
});

export const partnerUserSchema = z.object({
  id,
  userId: id,
  partnerId: id,
  title: z.string(),
  ...timestamps,
});

export const consentGrantSchema = z.object({
  id,
  caseId: id,
  userId: id,
  partnerId: id,
  scope: z.enum(["report", "report_and_documents", "none"]),
  granted: z.boolean(),
  grantedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  ...timestamps,
});

export const integrationSchema = z.object({
  id,
  partnerId: id,
  apiKeyMasked: z.string(),
  apiKeyFull: z.string(),
  webhookUrl: z.string(),
  webhookHealth: z.enum(["operational", "degraded"]),
  lastSyncAt: iso,
  requestVolume: z.array(z.number()),
  status: z.enum(["operational", "degraded"]),
  ...timestamps,
});

export const auditLogEntrySchema = z.object({
  id,
  actorId: id,
  actorName: z.string(),
  actorRole: roleSchema,
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  detail: z.string(),
  at: iso,
  ...timestamps,
});

export const ledgerEntrySchema = z.object({
  id,
  index: z.number().int(),
  previousHash: z.string(),
  documentHash: z.string(),
  documentId: id,
  caseId: id,
  actorId: id,
  actorRole: roleSchema,
  action: z.string(),
  timestamp: iso,
  blockHash: z.string(),
  ...timestamps,
});

export const provenanceCertificateSchema = z.object({
  id,
  caseId: id,
  reference: z.string(),
  ledgerFrom: z.number(),
  ledgerTo: z.number(),
  documentHashes: z.array(z.object({ fileName: z.string(), sha256: z.string() })),
  issuedAt: iso,
  ...timestamps,
});

export const emailTemplateSchema = z.enum([
  "otp",
  "welcome",
  "documents_received",
  "payment_receipt",
  "under_review",
  "report_ready",
  "info_requested",
]);

export const emailMessageSchema = z.object({
  id,
  to: z.string().email(),
  template: emailTemplateSchema,
  subject: z.string(),
  props: z.record(z.string()),
  href: z.string(),
  ...timestamps,
});

export const signupSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  phoneCountry: z.string().min(2),
  phone: z.string().min(6, "Enter a phone number."),
  fullName: z.string().min(2, "Enter your full legal name."),
  passportNumber: z.string().min(4, "Enter the passport number."),
  nationalId: z.string().min(4, "Enter the national ID number."),
  password: z.string().min(8, "Use at least 8 characters."),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required to create an account." }) }),
});

export const loginSchema = z
  .object({
    email: z.string().email("Enter a valid email address."),
    password: z.string().optional(),
    code: z.string().optional(),
  })
  .refine((v) => (v.password && v.password.length >= 8) || (v.code && v.code.length === 6), {
    message: "Enter your password, or a 6-digit code.",
    path: ["password"],
  });

export const otpSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export const profilePatchSchema = profileSchema.partial().extend({ userId: id.optional() });

export const casePatchSchema = z.object({
  base: caseSchema.optional(),
  patch: z.record(z.unknown()).optional(),
  advance: z.boolean().optional(),
});

export const uploadSchema = z.object({
  fileName: z.string().min(1),
  size: z.number().int().nonnegative(),
  contentType: z.string().min(1),
  sha256: z.string().min(64),
});

export const documentCreateSchema = z.object({
  baseCase: caseSchema.optional(),
  type: documentTypeSchema,
  fileName: z.string(),
  sizeBytes: z.number(),
  contentType: z.string(),
  sha256: z.string(),
  readable: z.boolean(),
  pagesDetected: z.boolean(),
  source: z.enum(["customer", "partner"]).default("customer"),
  sourceLabel: z.string().nullable().optional(),
  uploadedById: id,
});

export const noteCreateSchema = z.object({
  authorId: id,
  authorName: z.string(),
  authorRole: roleSchema,
  body: z.string().min(1),
});

export const decisionSchema = z.object({
  base: caseSchema,
  action: z.enum(["approve", "reject", "escalate"]),
  reason: z.string().min(3, "A reason is required."),
  actorId: id,
  actorName: z.string(),
  actorRole: roleSchema,
});

export const assignSchema = z.object({
  base: caseSchema,
  analystId: id,
  actorId: id,
  actorName: z.string(),
});

export const requestInfoSchema = z.object({
  base: caseSchema,
  message: z.string().min(3),
  actorId: id,
  actorName: z.string(),
});

export const ratingPutSchema = ratingAssessmentSchema.omit({ id: true, createdAt: true, updatedAt: true, factors: true, computedScore: true, band: true }).extend({
  base: ratingAssessmentSchema.optional(),
});

export const qaSchema = z.object({
  base: caseSchema,
  decision: z.enum(["approve", "revise", "send_back", "escalate"]),
  reason: z.string().min(3),
  actorId: id,
  actorName: z.string(),
});

export const feedbackSendSchema = z.object({
  base: caseSchema,
  summary: z.string().min(10),
  visibleToPartner: z.boolean(),
  actorId: id,
  actorName: z.string(),
  rating: ratingAssessmentSchema.optional(),
});

export const shareSchema = z.object({
  base: caseSchema,
  grants: z.array(
    z.object({
      partnerId: id,
      scope: z.enum(["report", "report_and_documents", "none"]),
      granted: z.boolean(),
      expiresAt: z.string().nullable(),
    }),
  ),
  actorId: id,
});

export const checkoutSchema = z.object({
  caseId: id,
  userId: id,
  country: z.string(),
  cardNumber: z.string(),
  base: caseSchema.optional(),
});

export const verifyHashSchema = z.object({
  hash: z.string().min(8),
  documentId: z.string().optional(),
});

export const userRolePatchSchema = z.object({
  role: roleSchema,
});

export const consentPutSchema = z.object({
  grants: z.array(consentGrantSchema),
});
