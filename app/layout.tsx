import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Build Doctor Agent",
  description: "AI-powered frontend build diagnostics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
