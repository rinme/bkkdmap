import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Noto_Sans_Thai } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800']
});

const thaiFont = Noto_Sans_Thai({
  subsets: ['thai'],
  variable: '--font-thai',
  display: 'swap',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'Bangkok 50 Districts Tracker | สำรวจ 50 เขตกรุงเทพฯ',
  description: 'Interactive map & explorer to track your visits, landmark discoveries, and spots across all 50 districts of Bangkok.',
  keywords: ['Bangkok', 'Districts', 'Khet', 'Bangkok Map', 'Travel Tracker', 'Thailand', 'กรุงเทพมหานคร', '50 เขต'],
  authors: [{ name: 'Bangkok District Tracker' }],
  icons: {
    icon: '/favicon.ico'
  },
  openGraph: {
    title: 'Bangkok 50 Districts Tracker | สำรวจ 50 เขตกรุงเทพฯ',
    description: 'Track your journeys, landmark discoveries, and passport rank across all 50 districts of Bangkok.',
    type: 'website'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#060913'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`dark ${sansFont.variable} ${thaiFont.variable}`}>
      <body className="font-sans antialiased bg-[#060913] text-slate-100 min-h-screen selection:bg-emerald-500 selection:text-white overflow-x-hidden">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

