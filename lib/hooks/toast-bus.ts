export type ToastInput = { title: string; body?: string; href?: string; tone?: "info" | "success" | "warning" | "error" };

type Listener = (toast: ToastInput) => void;
const listeners = new Set<Listener>();

export function pushToast(toast: ToastInput): void {
  listeners.forEach((listener) => listener(toast));
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
