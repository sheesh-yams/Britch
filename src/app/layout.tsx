import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Britch — Price on reach. Pitch like an agency.",
  description: "Data-driven rate pages and agency-grade proposals for content creators.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Clash Display + General Sans via Fontshare; Space Mono via Google */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=general-sans@400,500,600,700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap"
        />
      </head>
      <body
        style={
          {
            "--font-clash-display": "'Clash Display'",
            "--font-general-sans": "'General Sans'",
            "--font-space-mono": "'Space Mono'",
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
