"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, FormField, Input, Select } from "@/components/ui/fields";
import { Alert } from "@/components/ui/feedback";
import { Stepper } from "@/components/ui/progress";
import { DocumentCard, FileDropzone } from "@/components/ui/files";
import { HashChip } from "@/components/trust/HashChip";
import { MARKET_OPTIONS } from "@/lib/utils/money";
import { useSession } from "@/lib/hooks/useSession";
import { getMe, updateMe } from "@/lib/services/authService";
import { createCase, listDocuments, loadDraft, saveDraft, submitCase, updateCase, verifyIdentity } from "@/lib/services/casesService";
import { removeDocument, uploadCaseDocument } from "@/lib/services/documentsService";
import { nowIso } from "@/lib/utils/id";
import type { Document, DocumentType, Profile } from "@/lib/types";

const STEPS = ["Profile", "Documents", "Identity", "Review"];
const SLOTS: { type: DocumentType; label: string; required: boolean }[] = [
  { type: "passport", label: "Passport (first 2 pages)", required: true },
  { type: "credit_report", label: "Latest local-country credit report", required: true },
  { type: "banking_evidence", label: "Optional supporting banking evidence", required: false },
];

export function NewRequestWizard() {
  const router = useRouter();
  const { session } = useSession();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [kyc, setKyc] = useState<"idle" | "pending" | "matched" | "failed">("idle");
  const [declare, setDeclare] = useState(false);
  const [consent, setConsent] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(false);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const me = await getMe();
      setProfile(me.profile);
      const draft = await loadDraft(session.user.id);
      if (draft) {
        setCaseId(draft.caseId);
        setStep(draft.step);
        setDocs(await listDocuments(draft.caseId));
      }
    })().catch((err: Error) => setError(err.message));
  }, [session]);

  useEffect(() => {
    if (!session || !caseId) return;
    void saveDraft({ id: session.user.id, userId: session.user.id, caseId, step, createdAt: nowIso(), updatedAt: nowIso() });
  }, [session, caseId, step]);

  async function saveProfile() {
    if (!session || !profile) return;
    setBusy("profile");
    setError("");
    try {
      await updateMe({ profile });
      let id = caseId;
      if (!id) {
        const created = await createCase({ userId: session.user.id, country: profile.originCountry || "IN", countryName: MARKET_OPTIONS.find((item) => item.code === profile.originCountry)?.label ?? profile.originCountry, destinationCity: profile.destinationCity || "Toronto" });
        id = created.id;
        setCaseId(id);
      }
      await updateCase(id, { status: "account_verified", country: profile.originCountry, destinationCity: profile.destinationCity || "Toronto" });
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setBusy(null);
    }
  }

  async function onFile(type: DocumentType, file: File) {
    if (!session || !caseId) return;
    setBusy(type);
    setError("");
    try {
      const existing = docs.find((doc) => doc.type === type);
      if (existing) removeDocument(existing.id);
      const document = await uploadCaseDocument(caseId, file, type, session.user.id);
      setDocs(await listDocuments(caseId).then((rows) => rows.some((row) => row.id === document.id) ? rows : [...rows, document]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      setCameraOn(false);
      setError("Camera is unavailable. Upload a photo instead.");
    }
  }

  async function capture(file?: File) {
    if (!session || !caseId) return;
    setKyc("pending");
    setError("");
    try {
      let shot = file;
      if (!shot && videoRef.current) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg"));
        if (blob) shot = new File([blob], "selfie_with_passport.jpg", { type: "image/jpeg" });
      }
      if (shot) await uploadCaseDocument(caseId, shot, "selfie", session.user.id);
      await verifyIdentity(caseId, "start");
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const identity = await verifyIdentity(caseId, "complete");
      setKyc(identity.status === "matched" ? "matched" : "failed");
      setDocs(await listDocuments(caseId));
    } catch (err) {
      setKyc("failed");
      setError(err instanceof Error ? err.message : "Identity check failed.");
    }
  }

  async function finish() {
    if (!caseId) return;
    setBusy("submit");
    try {
      await submitCase(caseId);
      router.push(`/requests/${caseId}/payment`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setBusy(null);
    }
  }

  const hasPassport = docs.some((doc) => doc.type === "passport");
  const hasCredit = docs.some((doc) => doc.type === "credit_report");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-lake-dark">Step {step + 1} of 4</p>
        <h1 className="text-3xl font-bold tracking-tightest">New rating request</h1>
        <p className="mt-1 text-ink-soft">Result within 48 hours of payment. A credit report is the summary your home-country bureau keeps of loans and repayments.</p>
      </div>
      <Stepper steps={STEPS} current={step} />
      {error && <Alert tone="error">{error}</Alert>}
      {step === 0 && profile && (
        <form className="space-y-4 rounded-3xl border border-ink/10 bg-white p-6" onSubmit={(event) => { event.preventDefault(); void saveProfile(); }}>
          <FormField id="fullName" label="Full legal name"><Input id="fullName" value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} /></FormField>
          <FormField id="origin" label="Home country">
            <Select id="origin" value={profile.originCountry} onChange={(event) => setProfile({ ...profile, originCountry: event.target.value })}>
              {MARKET_OPTIONS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </Select>
          </FormField>
          <FormField id="city" label="Home city"><Input id="city" value={profile.originCity} onChange={(event) => setProfile({ ...profile, originCity: event.target.value })} /></FormField>
          <FormField id="dest" label="Canadian city"><Input id="dest" value={profile.destinationCity} onChange={(event) => setProfile({ ...profile, destinationCity: event.target.value })} /></FormField>
          <FormField id="passport" label="Passport number" hint="Why we ask: analysts match this to the credit report."><Input id="passport" value={profile.passportNumber} onChange={(event) => setProfile({ ...profile, passportNumber: event.target.value })} /></FormField>
          <Button type="submit" loading={busy === "profile"}>Save and continue</Button>
        </form>
      )}
      {step === 1 && (
        <div className="space-y-4">
          {SLOTS.map((slot) => {
            const document = docs.find((item) => item.type === slot.type);
            return (
              <section key={slot.type} className="rounded-3xl border border-ink/10 bg-white p-5">
                <h2 className="font-semibold">{slot.label}</h2>
                {document ? (
                  <div className="mt-3 space-y-2">
                    <DocumentCard document={document} integrity="verified" onRemove={() => { removeDocument(document.id); setDocs((rows) => rows.filter((row) => row.id !== document.id)); }} />
                    <HashChip hash={document.sha256} />
                  </div>
                ) : (
                  <div className="mt-3"><FileDropzone label={busy === slot.type ? "Uploading…" : "Add file"} busy={busy === slot.type} onFile={(file) => void onFile(slot.type, file)} /></div>
                )}
              </section>
            );
          })}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(0)}>Back</Button>
            <Button type="button" disabled={!hasPassport || !hasCredit} onClick={() => setStep(2)}>Continue</Button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4 rounded-3xl border border-ink/10 bg-white p-6">
          <h2 className="text-xl font-semibold">Identity verification</h2>
          <p className="text-sm text-ink-soft">Take a selfie holding your passport. If the camera is blocked, upload a photo.</p>
          <div className="rounded-2xl border border-ink/10 bg-glacier p-4">
            <p className="text-sm font-semibold">KYC provider (Sumsub-style placeholder)</p>
            <p className="mt-1 text-sm capitalize text-ink-soft">Status: {kyc}</p>
          </div>
          <video ref={videoRef} autoPlay playsInline muted className={cameraOn ? "w-full rounded-2xl bg-ink" : "hidden"} />
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => void startCamera()}>Use camera</Button>
            {cameraOn && <Button type="button" onClick={() => void capture()}>Capture selfie</Button>}
            <label className="btn btn-secondary cursor-pointer">
              Upload photo
              <input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void capture(file); }} />
            </label>
          </div>
          {kyc === "failed" && <Button type="button" variant="danger" onClick={() => void capture()}>Retry check</Button>}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button type="button" disabled={kyc !== "matched"} onClick={() => setStep(3)}>Continue</Button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4 rounded-3xl border border-ink/10 bg-white p-6">
          <h2 className="text-xl font-semibold">Review and submit</h2>
          <ul className="space-y-3">
            {docs.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-glacier px-3 py-2">
                <span className="text-sm font-semibold">{doc.fileName}</span>
                <HashChip hash={doc.sha256} />
              </li>
            ))}
          </ul>
          <Checkbox id="declare" checked={declare} onChange={(event) => setDeclare(event.target.checked)} label="I declare these documents are mine and have not been altered." />
          <Checkbox id="share-consent" checked={consent} onChange={(event) => setConsent(event.target.checked)} label="I consent to NOAHFI processing this file for a Canadian-equivalent assessment." />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>Back</Button>
            <Button type="button" disabled={!declare || !consent} loading={busy === "submit"} onClick={() => void finish()}>Submit</Button>
          </div>
        </div>
      )}
      {!profile && <p className="text-sm text-ink-soft">Loading your profile…</p>}
    </div>
  );
}
