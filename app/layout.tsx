import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/instrument-sans";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { DemoControlPanel } from "@/components/layout/DemoControlPanel";

export const metadata: Metadata = {
  title: { default: "NOAHFI | Canadian credit assessment for newcomers", template: "%s | NOAHFI" },
  description: "Convert your home-country banking and credit history into a Canadian-equivalent credit profile before you arrive. Result within 48 hours.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
        <ToastProvider>
          <div id="content">{children}</div>
          <DemoControlPanel />
        </ToastProvider>
      </body>
    </html>
  );
}
