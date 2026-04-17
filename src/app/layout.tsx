import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/context/SessionContext";

export const metadata: Metadata = {
  title: "Live Suggestions — AI Meeting Copilot",
  description: "Real-time AI meeting copilot with live transcript, contextual suggestions, and chat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
