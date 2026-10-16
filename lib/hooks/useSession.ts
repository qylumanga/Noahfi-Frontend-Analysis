"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { subscribe } from "@/lib/demo-db";
import { currentSession } from "@/lib/services/authService";

export function useSession() {
  const session = useSyncExternalStore(subscribe, () => currentSession(), () => null);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return { session: ready ? session : null, ready };
}
