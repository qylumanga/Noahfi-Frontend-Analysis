"use client";

import { useParams } from "next/navigation";
import { Workspace } from "./Workspace";
import { FeedbackComposer, QaScreen, RatingWorkspace } from "./RatingQa";

export function WorkspacePage() {
  const params = useParams<{ caseId: string }>();
  return <Workspace caseId={params.caseId} />;
}

export function RatingPage() {
  const params = useParams<{ caseId: string }>();
  return <RatingWorkspace caseId={params.caseId} />;
}

export function QaPage() {
  const params = useParams<{ caseId: string }>();
  return <QaScreen caseId={params.caseId} />;
}

export function FeedbackPage() {
  const params = useParams<{ caseId: string }>();
  return <FeedbackComposer caseId={params.caseId} />;
}
