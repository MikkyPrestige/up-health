import type { Metadata } from "next";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/instrument-sans/600.css";
import "@fontsource/instrument-sans/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./globals.css";
import { NetworkFooter } from "@/components/NetworkFooter";
import { Web3Providers } from "@/components/Web3Providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://up-health.vercel.app"),
  title: "UP Health",
  description:
    "A read-only diagnostic tool for LUKSO Universal Profile security & configuration.",
  openGraph: {
    title: "UP Health",
    description:
      "See exactly who can do what to your Universal Profile, and whether anything's worth a closer look.",
    url: "https://up-health.vercel.app",
    siteName: "UP Health",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UP Health",
    description:
      "See exactly who can do what to your Universal Profile, and whether anything's worth a closer look.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Web3Providers>
          {children}
          <NetworkFooter />
        </Web3Providers>
      </body>
    </html>
  );
}
