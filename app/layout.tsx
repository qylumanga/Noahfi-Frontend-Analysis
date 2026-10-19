import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { DemoControlPanel } from "@/components/layout/DemoControlPanel";

export const metadata: Metadata = {
  title: { default: "NOAHFI | Your global credit bridge", template: "%s | NOAHFI" },
  description: "Your global credit. Ready for Canada. NOAHFI turns home-country credit history into a Canadian-equivalent profile within 48 hours.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
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
