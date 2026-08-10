import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("site_name, header_description, favicon_url")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error && process.env.NODE_ENV === "development") {
    console.error("Failed to load site metadata from Supabase:", error);
  }

  const faviconUrl = data?.favicon_url || "/pastel-crown-p-favicon.png";

  return {
    title: data?.site_name ?? "파스텔에듀",
    description: data?.header_description ?? "파스텔에듀 수업자료실",
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl
    }
  };
}

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
