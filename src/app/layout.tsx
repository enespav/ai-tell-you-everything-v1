import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Tell You Everything",
  description:
    "Turn fragments into printed micro-stories shaped by atmosphere, observation, and place.",
  applicationName: "AI Tell You Everything",
  openGraph: {
    title: "AI Tell You Everything",
    description:
      "Turn fragments into printed micro-stories shaped by atmosphere, observation, and place.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo-web.svg",
        alt: "AI Tell You Everything",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Tell You Everything",
    description:
      "Turn fragments into printed micro-stories shaped by atmosphere, observation, and place.",
    images: ["/logo-web.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#164194" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var lang=localStorage.getItem('language');if(lang==='de'||lang==='en'){document.documentElement.lang=lang;}}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
