import type { z } from "zod";
import type {
  auditLogEntrySchema,
  caseSchema,
  caseStatusSchema,
  consentGrantSchema,
  documentSchema,
  documentTypeSchema,
  emailMessageSchema,
  emailTemplateSchema,
  feedbackSchema,
  identityVerificationSchema,
  integrationSchema,
  invoiceSchema,
  ledgerEntrySchema,
  noteSchema,
  notificationSchema,
  partnerSchema,
  partnerUserSchema,
  paymentSchema,
  profileSchema,
  provenanceCertificateSchema,
  qaReviewSchema,
  ratingAssessmentSchema,
  ratingFactorSchema,
  redFlagSchema,
  reportSchema,
  roleSchema,
  sessionSchema,
  taskSchema,
  timelineEventSchema,
  userSchema,
} from "./schemas";

export type Role = z.infer<typeof roleSchema>;
export type CaseStatus = z.infer<typeof caseStatusSchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;
export type User = z.infer<typeof userSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Case = z.infer<typeof caseSchema>;
export type Document = z.infer<typeof documentSchema>;
export type IdentityVerification = z.infer<typeof identityVerificationSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type RatingFactor = z.infer<typeof ratingFactorSchema>;
export type RatingAssessment = z.infer<typeof ratingAssessmentSchema>;
export type QaReview = z.infer<typeof qaReviewSchema>;
export type Feedback = z.infer<typeof feedbackSchema>;
export type Report = z.infer<typeof reportSchema>;
export type Note = z.infer<typeof noteSchema>;
export type Task = z.infer<typeof taskSchema>;
export type RedFlag = z.infer<typeof redFlagSchema>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type Partner = z.infer<typeof partnerSchema>;
export type PartnerUser = z.infer<typeof partnerUserSchema>;
export type ConsentGrant = z.infer<typeof consentGrantSchema>;
export type Integration = z.infer<typeof integrationSchema>;
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;
export type ProvenanceCertificate = z.infer<typeof provenanceCertificateSchema>;
export type EmailTemplateId = z.infer<typeof emailTemplateSchema>;
export type EmailMessage = z.infer<typeof emailMessageSchema>;

/** Seed-only credential. Never returned by API responses. */
export type SeedUser = User & { password: string };

export type EmailDraft = {
  to: string;
  template: EmailTemplateId;
  props: Record<string, string>;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
};

export type PricingQuote = {
  country: string;
  baseUsd: number;
  taxName: string;
  taxRate: number;
  taxUsd: number;
  totalUsd: number;
  currency: string;
  fx: number;
  totalLocal: number;
};

export type SourceSummary = {
  id: string;
  caseId: string;
  bureau: string;
  bureauScore: number;
  yearsOfHistory: number;
  delinquencies: number;
  utilizationPct: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type WizardDraft = {
  id: string;
  userId: string;
  caseId: string;
  step: number;
  createdAt: string;
  updatedAt: string;
};

export type DemoAccount = {
  id: string;
  email: string;
  password: string;
  user: User;
};

export type SavedView = {
  id: string;
  name: string;
  query: string;
  status: string;
  country: string;
  risk: string;
  sla: string;
  partnerId: string;
  analystId: string;
  createdAt: string;
  updatedAt: string;
};
