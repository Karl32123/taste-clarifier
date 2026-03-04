import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taste Clarifier • You + Grok",
  description: "We make your eye for beauty super sharp",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-stone-200">
        {children}
      </body>
    </html>
  );
}
