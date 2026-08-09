import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pastel PPT Library",
  description: "Customizable PPT resource board",
  icons: {
    icon: "/pastel-crown-p-favicon.png",
    shortcut: "/pastel-crown-p-favicon.png",
    apple: "/pastel-crown-p-favicon.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
