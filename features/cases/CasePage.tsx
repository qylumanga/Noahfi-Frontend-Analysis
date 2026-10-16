"use client";

import { useParams } from "next/navigation";
import { CaseDetail } from "./CaseDetail";
import { ReportView } from "./ReportView";
import { CertificateView } from "./CertificateView";

export function CasePage() {
  const params = useParams<{ caseId: string }>();
  return <CaseDetail caseId={params.caseId} />;
}

export function ReportPage() {
  const params = useParams<{ caseId: string }>();
  return <ReportView caseId={params.caseId} />;
}

export function CertificatePage() {
  const params = useParams<{ caseId: string }>();
  return <CertificateView caseId={params.caseId} />;
}
