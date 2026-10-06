import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TherapyDocs — Visit Documentation",
  description: "Home health therapy practice management",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
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
