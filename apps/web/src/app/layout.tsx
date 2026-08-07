import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/session-provider-wrapper";
import { ThemeProvider, ThemeFlashGuard } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast-provider";

export const metadata: Metadata = {
  title: "IPSkill — Unique Skills, Perfect Match.",
  description: "The developer hub for verified, skill-validated tech candidates.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ThemeFlashGuard />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <SessionProviderWrapper>{children}</SessionProviderWrapper>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
