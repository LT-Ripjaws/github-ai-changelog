import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Changelog AI",
  description: "AI-powered GitHub changelog generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
