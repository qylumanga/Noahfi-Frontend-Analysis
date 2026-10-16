import type { Profile, Session, User } from "@/lib/types";
import { findAccount, readSession, upsert, writeSession, clearSession } from "@/lib/demo-db";
import { applyEffects } from "./effects";
import { api } from "./api";

type AccountHeader = { user: User; password: string; email: string };

function accountHeaders(email?: string): HeadersInit {
  if (!email) return {};
  const account = findAccount(email);
  if (!account) return {};
  return { "x-demo-account": encodeURIComponent(JSON.stringify(account)) };
}

export async function signup(input: {
  email: string;
  phoneCountry: string;
  phone: string;
  fullName: string;
  passportNumber: string;
  nationalId: string;
  password: string;
  consent: true;
}): Promise<{ user: User; profile: Profile }> {
  const data = await api<{ user: User; profile: Profile; password: string; email: Parameters<typeof applyEffects>[0]["email"] }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
  upsert("users", data.user);
  upsert("profiles", data.profile);
  upsert("accounts", { id: data.user.id, email: data.user.email, password: input.password, user: data.user });
  if (data.email) await applyEffects({ email: data.email });
  return { user: data.user, profile: data.profile };
}

export async function verifyOtp(email: string, code: string): Promise<User> {
  const data = await api<{ user: User; email?: Parameters<typeof applyEffects>[0]["email"] }>("/api/auth/verify-otp", {
    method: "POST",
    headers: accountHeaders(email),
    body: JSON.stringify({ email, code }),
  });
  upsert("users", data.user);
  const account = findAccount(email);
  if (account) upsert("accounts", { ...account, user: data.user });
  if (data.email) await applyEffects({ email: data.email });
  return data.user;
}

export async function resendOtp(email: string): Promise<void> {
  const data = await api<{ email: Parameters<typeof applyEffects>[0]["email"] }>("/api/auth/resend-otp", {
    method: "POST",
    headers: accountHeaders(email),
    body: JSON.stringify({ email }),
  });
  if (data.email) await applyEffects({ email: data.email });
}

export async function login(input: { email: string; password?: string; code?: string }): Promise<Session> {
  const session = await api<Session>("/api/auth/login", {
    method: "POST",
    headers: accountHeaders(input.email),
    body: JSON.stringify(input),
  });
  writeSession(session);
  return session;
}

export async function logout(): Promise<void> {
  await api("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
  clearSession();
}

export function currentSession(): Session | null {
  const session = readSession();
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    clearSession();
    return null;
  }
  return session;
}

export async function forgotPassword(email: string): Promise<void> {
  const data = await api<{ email?: Parameters<typeof applyEffects>[0]["email"] }>("/api/auth/forgot-password", {
    method: "POST",
    headers: accountHeaders(email),
    body: JSON.stringify({ email }),
  });
  if (data.email) await applyEffects({ email: data.email });
}

export async function getMe(): Promise<{ user: User; profile: Profile | null }> {
  const data = await api<{ user: User; profile: Profile | null }>("/api/users/me");
  const { mergeById, readBag } = await import("@/lib/demo-db");
  const users = mergeById<User>([data.user], "users");
  const user = users.find((item) => item.id === data.user.id) ?? data.user;
  const profiles = mergeById<Profile>(data.profile ? [data.profile] : [], "profiles");
  const profile = profiles.find((item) => item.userId === user.id) ?? readBag<Profile>("profiles").upserts.find((item) => item.userId === user.id) ?? null;
  return { user, profile };
}

export async function updateMe(patch: { user?: Partial<User>; profile?: Partial<Profile> }): Promise<{ user: User; profile: Profile | null }> {
  const data = await api<{ user: User; profile: Profile | null }>("/api/users/me", { method: "PATCH", body: JSON.stringify(patch) });
  upsert("users", data.user);
  if (data.profile) upsert("profiles", data.profile);
  const session = readSession();
  if (session && session.user.id === data.user.id) {
    writeSession({ ...session, user: { id: data.user.id, email: data.user.email, role: data.user.role, name: data.user.name } });
  }
  return data;
}
