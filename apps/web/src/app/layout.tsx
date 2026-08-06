import type { Metadata } from "next";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/session-provider-wrapper";

export const metadata: Metadata = {
  title: "IPSkill — Unique Skills, Perfect Match.",
  description: "The developer hub for verified, skill-validated tech candidates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
