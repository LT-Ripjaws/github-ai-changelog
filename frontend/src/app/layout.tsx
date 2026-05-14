import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const displayFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RepoNarrate",
  description: "AI-powered GitHub repository changelog and release notes generator",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.documentElement.classList.add('dark');
              document.documentElement.style.colorScheme = 'dark';
            `,
          }}
        />
      </head>
      <body
        className={`${displayFont.variable} ${monoFont.variable} font-sans antialiased font-feature-settings-cv01-ss03`}
      >
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
