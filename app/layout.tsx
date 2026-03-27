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

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Career Coach | Tech Interview & ATS Platform',
  description: 'An advanced, AI-powered platform for resume ATS analysis, generative cover letters, and live DSA mock interviews.',
  openGraph: {
    title: 'AI Career Coach',
    description: 'Level up your tech career with AI-driven ATS scoring, GitHub analysis, and live technical mock interviews.',
    url: 'https://ai-career-coach-frontend-peach.vercel.app',
    siteName: 'AI Career Coach',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Career Coach | Master Your Interview',
    description: 'Level up your tech career with AI-driven ATS scoring and live mock interviews.',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
