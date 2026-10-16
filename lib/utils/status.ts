import type { CaseStatus, Role } from "@/lib/types";

export const MAIN_TIMELINE: { status: CaseStatus; label: string; hint: string }[] = [
  { status: "account_verified", label: "Account verified", hint: "Your email and profile are confirmed." },
  { status: "documents_uploaded", label: "Documents uploaded", hint: "Passport and credit report are on file." },
  { status: "identity_verified", label: "Identity verified", hint: "The identity check matched your documents." },
  { status: "payment_received", label: "Payment received", hint: "The assessment fee has been paid." },
  { status: "under_review", label: "Under review", hint: "An analyst is reading your documents." },
  { status: "quality_check", label: "Quality check", hint: "A reviewer is checking the assessment." },
  { status: "finalized", label: "Finalized", hint: "The assessment is locked." },
  { status: "ready_to_download", label: "Ready to download", hint: "Your report is ready." },
];

export const STATUS_LABEL: Record<CaseStatus, string> = {
  draft: "Draft",
  account_verified: "Account verified",
  documents_uploaded: "Documents uploaded",
  identity_verified: "Identity verified",
  payment_received: "Payment received",
  under_review: "Under review",
  quality_check: "Quality check",
  finalized: "Finalized",
  ready_to_download: "Ready to download",
  info_requested: "Info requested",
  escalated: "Escalated",
  rejected: "Rejected",
};

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export const STATUS_TONE: Record<CaseStatus, StatusTone> = {
  draft: "neutral",
  account_verified: "info",
  documents_uploaded: "info",
  identity_verified: "info",
  payment_received: "info",
  under_review: "warning",
  quality_check: "warning",
  finalized: "success",
  ready_to_download: "success",
  info_requested: "warning",
  escalated: "danger",
  rejected: "danger",
};

export function timelineIndex(status: CaseStatus): number {
  const direct = MAIN_TIMELINE.findIndex((s) => s.status === status);
  if (direct >= 0) return direct;
  if (status === "info_requested" || status === "escalated") return MAIN_TIMELINE.findIndex((s) => s.status === "under_review");
  return -1;
}

export function nextStatus(status: CaseStatus): CaseStatus | null {
  if (status === "draft") return "account_verified";
  if (status === "info_requested" || status === "escalated") return "under_review";
  const i = MAIN_TIMELINE.findIndex((s) => s.status === status);
  if (i < 0 || i === MAIN_TIMELINE.length - 1) return null;
  return MAIN_TIMELINE[i + 1].status;
}

export function portalFor(role: Role): string {
  if (role === "customer") return "/dashboard";
  if (role === "partner") return "/partner";
  return "/internal";
}

export const INTERNAL_ROLES: Role[] = ["analyst", "reviewer", "admin", "compliance"];

export function can(role: Role, capability: "queue" | "rate" | "qa" | "assign" | "feedback" | "admin" | "audit"): boolean {
  const matrix: Record<typeof capability, Role[]> = {
    queue: ["analyst", "reviewer", "admin", "compliance"],
    rate: ["analyst", "reviewer", "admin", "compliance"],
    qa: ["reviewer", "admin"],
    assign: ["reviewer", "admin"],
    feedback: ["reviewer", "admin"],
    admin: ["admin"],
    audit: ["admin", "compliance"],
  };
  return matrix[capability].includes(role);
}

export function canEditRating(role: Role): boolean {
  return role === "analyst";
}
