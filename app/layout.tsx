import type { Metadata } from "next";
import Script from "next/script";
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
      <head>
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-PTZ3PF9B');`}
        </Script>
        <link rel="preconnect" href="https://nwkxpcqjtmhsuakgupjn.supabase.co" crossOrigin="anonymous" />
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PTZ3PF9B"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
