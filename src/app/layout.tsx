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
    "Aus Input wird eine gedruckte Story: Beobachtungen, Orte und Stimmungen werden zu erzählbaren Mikrotexten.",
  applicationName: "AI Tell You Everything",
  openGraph: {
    title: "AI Tell You Everything",
    description:
      "Aus Input wird eine gedruckte Story: Beobachtungen, Orte und Stimmungen werden zu erzählbaren Mikrotexten.",
    type: "website",
    locale: "de_DE",
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
      "Aus Input wird eine gedruckte Story: Beobachtungen, Orte und Stimmungen werden zu erzählbaren Mikrotexten.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#164194" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
