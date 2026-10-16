"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, FormField, Input, PhoneInput, Radio, Select, Switch, Textarea } from "@/components/ui/fields";
import { Alert, Badge, EmptyState, Skeleton, StatusTag, Tooltip } from "@/components/ui/feedback";
import { Card, KpiCard, Pagination, Table, Tabs, Avatar } from "@/components/ui/data";
import { ProgressBar, Stepper, Timeline } from "@/components/ui/progress";
import { CopyButton, FileDropzone } from "@/components/ui/files";
import { SlaBadge } from "@/components/ui/SlaBadge";
import { ScoreGauge, SvgBarChart, SvgDonut, SvgSparkline } from "@/components/ui/charts";
import { Modal, Drawer } from "@/components/ui/overlay";
import { HashChip } from "@/components/trust/HashChip";
import { IntegrityBadge } from "@/components/trust/IntegrityBadge";
import { pushToast } from "@/components/ui/Toast";

export default function DesignSystemPage() {
  const [tab, setTab] = useState("one");
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [on, setOn] = useState(true);
  const [page, setPage] = useState(1);
  return (
    <main className="container-page space-y-8 py-12">
      <h1 className="text-4xl font-bold tracking-tightest">Design system</h1>
      <section className="flex flex-wrap gap-2">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="lake">Lake</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button loading>Loading</Button>
      </section>
      <FormField id="demo-name" label="Name" hint="Helper text" error=""><Input id="demo-name" placeholder="Priya Raman" /></FormField>
      <Textarea aria-label="Notes" placeholder="Notes" />
      <Select aria-label="Country" defaultValue="IN"><option value="IN">India</option></Select>
      <PhoneInput id="demo-phone" country="IN" number="9840011223" onCountry={() => undefined} onNumber={() => undefined} />
      <Checkbox id="demo-check" label="Consent" defaultChecked />
      <Radio name="band" value="good" onChange={() => undefined} options={[{ value: "good", label: "Good" }, { value: "fair", label: "Fair" }]} />
      <Switch checked={on} onChange={setOn} label="Share" />
      <div className="flex flex-wrap gap-2"><Badge>Neutral</Badge><Badge tone="info">Info</Badge><Badge tone="success">Success</Badge><StatusTag status="under_review" /><StatusTag status="ready_to_download" /><StatusTag status="rejected" /></div>
      <Alert tone="info" title="Info">A calm notice.</Alert>
      <Alert tone="success" title="Success">Saved.</Alert>
      <Alert tone="warning" title="Warning">Check this.</Alert>
      <Alert tone="error" title="Error">Something failed.</Alert>
      <Card><p>Card</p></Card>
      <div className="grid gap-3 sm:grid-cols-3"><KpiCard label="Open" value="4" hint="Cases" /><SlaBadge due="2026-10-16T18:30:00.000Z" status="under_review" /><Avatar name="Mei Tanaka" /></div>
      <Tabs tabs={[{ id: "one", label: "One" }, { id: "two", label: "Two" }]} value={tab} onChange={setTab} />
      <Table columns={[{ key: "name", label: "Name", sortable: true }, { key: "city", label: "City" }]} rows={[{ id: "1", name: "Priya Raman", city: "Chennai" }]} />
      <Pagination page={page} pages={3} onPage={setPage} />
      <ProgressBar value={40} label="Upload" />
      <Stepper steps={["Profile", "Documents", "Identity", "Review"]} current={1} />
      <Timeline items={[{ title: "Uploaded", at: "Sep 28", done: true }]} />
      <Skeleton className="h-8 w-40" />
      <EmptyState title="Empty" body="Nothing here yet." />
      <Tooltip label="A credit report is a summary of loans and repayments."><button type="button" className="underline">What is a credit report?</button></Tooltip>
      <CopyButton value="demo-hash" />
      <FileDropzone label="Drop a file" onFile={() => undefined} />
      <SvgSparkline values={[4, 8, 6, 10, 7]} label="Volume" />
      <SvgBarChart rows={[{ label: "Mon", value: 4 }, { label: "Tue", value: 9 }]} label="Bars" />
      <SvgDonut value={96} label="SLA" />
      <ScoreGauge score={712} band="Good" />
      <div className="flex gap-2"><IntegrityBadge state="verified" /><IntegrityBadge state="pending" /><IntegrityBadge state="not_found" /><IntegrityBadge state="tampered" /><IntegrityBadge state="verified_source" /></div>
      <HashChip hash={"a".repeat(64)} />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>Open modal</Button>
        <Button type="button" variant="secondary" onClick={() => setDrawer(true)}>Open drawer</Button>
        <Button type="button" variant="ghost" onClick={() => pushToast({ title: "Saved", tone: "success" })}>Toast</Button>
      </div>
      <Modal open={open} title="Dialog" onClose={() => setOpen(false)}><p>Focus stays inside. Escape closes.</p></Modal>
      <Drawer open={drawer} title="Drawer" onClose={() => setDrawer(false)}><p>Side panel.</p></Drawer>
    </main>
  );
}
