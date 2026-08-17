import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "WearWeather — See the look. Plan the wear.",
  description:
    "Rehearse an outfit for the day you actually have. Compare three explainable Wear Plans, then visualise one on yourself.",
  keywords: [
    "outfit planning",
    "virtual try-on",
    "wear weather",
    "wardrobe planning",
    "visual rehearsal",
  ],
  authors: [{ name: "WearWeather" }],
  openGraph: {
    title: "WearWeather — See the look. Plan the wear.",
    description: "Stop guessing the outfit. Start rehearsing the day.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "WearWeather" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WearWeather — See the look. Plan the wear.",
    description: "Stop guessing the outfit. Start rehearsing the day.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0c09",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${ibmPlexMono.variable}`}
    >
      <body className={`${GeistSans.className} relative overscroll-none bg-background font-sans text-foreground antialiased`}>
        {children}
      </body>
    </html>
  );
}
