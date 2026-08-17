import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WearWeather — See the look. Plan the wear.",
  description: "Rehearse an outfit for the day you actually have, with transparent plans and live virtual try-on.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
