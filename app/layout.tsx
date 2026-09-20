import type { Metadata, Viewport } from "next";

import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { StarField } from "@/components/motion/star-field";

import { fredoka, nunito } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Squishatlas",
    template: "%s · Squishatlas",
  },
  description: "Catalogue your Squishmallow collection under the night sky.",
  applicationName: "Squishatlas",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Squishatlas",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#14102B",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fredoka.variable} ${nunito.variable} font-sans antialiased`}
      >
        <StarField />
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
