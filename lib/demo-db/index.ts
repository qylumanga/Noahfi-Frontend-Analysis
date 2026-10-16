import type { DemoAccount, Session } from "@/lib/types";

export const SCHEMA_VERSION = 1;
const PREFIX = "noahfi:v1:";
const VERSION_KEY = `${PREFIX}schemaVersion`;
const SESSION_KEY = `${PREFIX}session`;
const FLAGS_KEY = `${PREFIX}flags`;

export type Collection =
  | "users"
  | "accounts"
  | "profiles"
  | "cases"
  | "documents"
  | "identity"
  | "payments"
  | "invoices"
  | "notifications"
  | "ratings"
  | "qa"
  | "feedback"
  | "reports"
  | "notes"
  | "tasks"
  | "redFlags"
  | "timeline"
  | "consents"
  | "ledger"
  | "audit"
  | "emails"
  | "certificates"
  | "drafts"
  | "views";

export type Bag<T> = { upserts: T[]; tombstones: string[] };

export type DemoFlags = {
  forceError: boolean;
  tamper: boolean;
  slaOffsetHours: number;
};

const EMPTY_FLAGS: DemoFlags = { forceError: false, tamper: false, slaOffsetHours: 0 };

const bagCache = new Map<string, { raw: string | null; value: Bag<unknown> }>();
let sessionRaw: string | null | undefined;
let sessionCache: Session | null = null;
let flagsRaw: string | null | undefined;
let flagsCache: DemoFlags = EMPTY_FLAGS;
let storeVersion = 0;
const listeners = new Set<() => void>();

function emptyBag<T>(): Bag<T> {
  return { upserts: [], tombstones: [] };
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStoreVersion(): number {
  return storeVersion;
}

function emit(): void {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
}

export function ensureSchema(): void {
  if (typeof window === "undefined") return;
  const current = window.localStorage.getItem(VERSION_KEY);
  if (current !== String(SCHEMA_VERSION)) {
    clearKeys();
    window.localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
    sessionRaw = undefined;
    flagsRaw = undefined;
    bagCache.clear();
    emit();
  }
}

function clearKeys(): void {
  if (typeof window === "undefined") return;
  const drop: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(PREFIX)) drop.push(key);
  }
  drop.forEach((key) => window.localStorage.removeItem(key));
}

export function readBag<T extends { id: string }>(collection: Collection): Bag<T> {
  if (typeof window === "undefined") return emptyBag();
  ensureSchema();
  const key = PREFIX + collection;
  const raw = window.localStorage.getItem(key);
  const hit = bagCache.get(key);
  if (hit && hit.raw === raw) return hit.value as Bag<T>;
  const value = raw ? (JSON.parse(raw) as Bag<T>) : emptyBag<T>();
  if (!Array.isArray(value.upserts) || !Array.isArray(value.tombstones)) return emptyBag();
  bagCache.set(key, { raw, value });
  return value;
}

function writeBag<T>(collection: Collection, bag: Bag<T>): void {
  if (typeof window === "undefined") return;
  const key = PREFIX + collection;
  const raw = JSON.stringify(bag);
  window.localStorage.setItem(key, raw);
  bagCache.set(key, { raw, value: bag });
  emit();
}

export function upsert<T extends { id: string }>(collection: Collection, entity: T): T {
  const bag = readBag<T>(collection);
  const upserts = bag.upserts.filter((item) => item.id !== entity.id);
  upserts.push(entity);
  writeBag(collection, { upserts, tombstones: bag.tombstones.filter((id) => id !== entity.id) });
  return entity;
}

export function tombstone(collection: Collection, id: string): void {
  const bag = readBag(collection);
  writeBag(collection, {
    upserts: bag.upserts.filter((item) => item.id !== id),
    tombstones: bag.tombstones.includes(id) ? bag.tombstones : [...bag.tombstones, id],
  });
}

export function mergeById<T extends { id: string }>(seed: T[], collection: Collection): T[] {
  const bag = readBag<T>(collection);
  const map = new Map(seed.map((item) => [item.id, item]));
  bag.tombstones.forEach((id) => map.delete(id));
  bag.upserts.forEach((item) => map.set(item.id, item));
  return [...map.values()];
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  ensureSchema();
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (raw === sessionRaw) return sessionCache;
  sessionRaw = raw;
  if (!raw) {
    sessionCache = null;
    return null;
  }
  try {
    sessionCache = JSON.parse(raw) as Session;
  } catch {
    sessionCache = null;
  }
  return sessionCache;
}

export function writeSession(session: Session): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(session);
  window.localStorage.setItem(SESSION_KEY, raw);
  sessionRaw = raw;
  sessionCache = session;
  emit();
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  sessionRaw = null;
  sessionCache = null;
  emit();
}

export function readFlags(): DemoFlags {
  if (typeof window === "undefined") return EMPTY_FLAGS;
  ensureSchema();
  const raw = window.localStorage.getItem(FLAGS_KEY);
  if (raw === flagsRaw) return flagsCache;
  flagsRaw = raw;
  if (!raw) {
    flagsCache = EMPTY_FLAGS;
    return flagsCache;
  }
  try {
    flagsCache = { ...EMPTY_FLAGS, ...(JSON.parse(raw) as Partial<DemoFlags>) };
  } catch {
    flagsCache = EMPTY_FLAGS;
  }
  return flagsCache;
}

export function writeFlags(patch: Partial<DemoFlags>): DemoFlags {
  const next = { ...readFlags(), ...patch };
  if (typeof window === "undefined") return next;
  const raw = JSON.stringify(next);
  window.localStorage.setItem(FLAGS_KEY, raw);
  flagsRaw = raw;
  flagsCache = next;
  emit();
  return next;
}

export function findAccount(email: string): DemoAccount | null {
  const bag = readBag<DemoAccount>("accounts");
  return bag.upserts.find((item) => item.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function resetDemoData(): void {
  clearKeys();
  if (typeof window !== "undefined") window.localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
  sessionRaw = null;
  sessionCache = null;
  flagsRaw = null;
  flagsCache = EMPTY_FLAGS;
  bagCache.clear();
  emit();
}

export function exportDemoData(): string {
  if (typeof window === "undefined") return "{}";
  const dump: Record<string, string | null> = {};
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(PREFIX)) dump[key] = window.localStorage.getItem(key);
  }
  return JSON.stringify(dump, null, 2);
}
