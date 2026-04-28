import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://my-matching-app-p5mb.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MUSUBU | 学生が作ったマッチングアプリ",
    template: "%s | MUSUBU",
  },
  description:
    "MUSUBUは、学生が作ったマッチングアプリです。始めにくいを、つながりやすいへ。",
  applicationName: "MUSUBU",
  keywords: [
    "MUSUBU",
    "マッチングアプリ",
    "学生が作ったマッチングアプリ",
    "学生制作",
    "出会い",
    "マッチング",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MUSUBU | 学生が作ったマッチングアプリ",
    description:
      "MUSUBUは、学生が作ったマッチングアプリです。始めにくいを、つながりやすいへ。",
    url: siteUrl,
    siteName: "MUSUBU",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MUSUBU | 学生が作ったマッチングアプリ",
    description:
      "MUSUBUは、学生が作ったマッチングアプリです。始めにくいを、つながりやすいへ。",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}