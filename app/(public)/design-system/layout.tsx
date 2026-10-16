import type { Metadata } from "next";

export const metadata: Metadata = { title: "Design system", description: "NOAHFI interface primitives." };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
