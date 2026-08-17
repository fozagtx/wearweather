import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WearWeather — See the look. Plan the wear.",
  description: "Rehearse an outfit for the day you actually have, with transparent plans and live virtual try-on.",
  keywords: ["outfit planning", "virtual try-on", "wear weather", "wardrobe planning"],
  openGraph: {
    title: "WearWeather — See the look. Plan the wear.",
    description: "A calm, explainable way to plan what to wear for the day ahead.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0c09",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
