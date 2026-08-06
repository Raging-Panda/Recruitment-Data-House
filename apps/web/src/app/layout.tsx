import type { Metadata } from "next";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/session-provider-wrapper";
import { ThemeProvider, ThemeFlashGuard } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "IPSkill — Unique Skills, Perfect Match.",
  description: "The developer hub for verified, skill-validated tech candidates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ThemeFlashGuard />
      </head>
      <body>
        <ThemeProvider>
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
