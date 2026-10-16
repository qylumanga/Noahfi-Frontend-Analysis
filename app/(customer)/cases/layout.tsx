import { PrintShell } from "@/components/layout/shells";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PrintShell>{children}</PrintShell>;
}
