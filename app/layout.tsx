import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pastel PPT Library",
  description: "Customizable PPT resource board"
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
