import type {
  AuditLogEntry,
  Case,
  ConsentGrant,
  Document,
  EmailMessage,
  Feedback,
  IdentityVerification,
  Integration,
  Invoice,
  LedgerEntry,
  Note,
  Notification,
  Partner,
  PartnerUser,
  Payment,
  Profile,
  ProvenanceCertificate,
  QaReview,
  RatingAssessment,
  RedFlag,
  Report,
  SeedUser,
  SourceSummary,
  Task,
  TimelineEvent,
} from "@/lib/types";
import auditLogs from "./audit-logs.json";
import cases from "./cases.json";
import certificates from "./certificates.json";
import consents from "./consents.json";
import documents from "./documents.json";
import emails from "./emails.json";
import feedback from "./feedback.json";
import identity from "./identity.json";
import integrations from "./integrations.json";
import invoices from "./invoices.json";
import ledger from "./ledger.json";
import metrics from "./metrics.json";
import notes from "./notes.json";
import notifications from "./notifications.json";
import partnerUsers from "./partner-users.json";
import partners from "./partners.json";
import payments from "./payments.json";
import profiles from "./profiles.json";
import qa from "./qa.json";
import ratings from "./ratings.json";
import redFlags from "./red-flags.json";
import reports from "./reports.json";
import sources from "./sources.json";
import tasks from "./tasks.json";
import timeline from "./timeline.json";
import users from "./users.json";

export const seedUsers = users as SeedUser[];
export const seedPartners = partners as Partner[];
export const seedPartnerUsers = partnerUsers as PartnerUser[];
export const seedProfiles = profiles as Profile[];
export const seedCases = cases as Case[];
export const seedDocuments = documents as Document[];
export const seedIdentity = identity as IdentityVerification[];
export const seedPayments = payments as Payment[];
export const seedInvoices = invoices as Invoice[];
export const seedRatings = ratings as RatingAssessment[];
export const seedQa = qa as QaReview[];
export const seedFeedback = feedback as Feedback[];
export const seedReports = reports as Report[];
export const seedNotes = notes as Note[];
export const seedTasks = tasks as Task[];
export const seedRedFlags = redFlags as RedFlag[];
export const seedTimeline = timeline as TimelineEvent[];
export const seedNotifications = notifications as Notification[];
export const seedConsents = consents as ConsentGrant[];
export const seedIntegrations = integrations as Integration[];
export const seedAudit = auditLogs as AuditLogEntry[];
export const seedLedger = ledger as LedgerEntry[];
export const seedCertificates = certificates as ProvenanceCertificate[];
export const seedEmails = emails as unknown as EmailMessage[];
export const seedSources = sources as SourceSummary[];
export const seedMetrics = metrics as {
  id: string;
  avgTurnaroundHours: number;
  slaCompliancePct: number;
  openCases: number;
  series: { date: string; opened: number; closed: number }[];
  fraudAlerts: number;
  integrationHealth: { name: string; status: "operational" | "degraded" }[];
  analysts: { id: string; name: string; open: number; closed: number }[];
  createdAt: string;
  updatedAt: string;
};

export function publicUser(user: SeedUser) {
  const { password: _password, ...safe } = user;
  return safe;
}
