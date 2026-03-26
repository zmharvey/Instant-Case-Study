import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instant Case Study",
  description: "Generate B2B case studies and LinkedIn posts from GitHub repos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-50 min-h-screen">{children}</body>
      </html>
    </ClerkProvider>
  );
}
