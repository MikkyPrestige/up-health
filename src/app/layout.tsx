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
  title: "UP Health",
  description:
    "A read-only diagnostic tool for LUKSO Universal Profile security & configuration.",
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
