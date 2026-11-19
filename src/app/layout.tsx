import DropBoxButton from "@/components/DropBoxButton";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "GLINFICO — Secure Sign-in",
  description: "GLINFICO secure member portal.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}<DropBoxButton />
</body>
    </html>
  );
}
