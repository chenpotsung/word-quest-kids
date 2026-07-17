import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.GITHUB_ACTIONS === "true" ? "/word-quest-kids" : "";

export const metadata: Metadata = {
  title: "Word Quest Kids｜英文大富翁冒險",
  description: "讓小學生透過闖關遊戲、圖片與發音學習英文單字。",
  icons: {
    icon: `${basePath}/favicon.svg`,
    shortcut: `${basePath}/favicon.svg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
