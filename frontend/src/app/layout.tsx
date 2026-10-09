import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Tessera",
  description: "Prioritize renewal risk with cross-call evidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Suspense fallback={<p className="p-md text-body-sm text-on-surface-muted">Loading workspace…</p>}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
