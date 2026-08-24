import type { Metadata, Viewport } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bangkok 50 Districts Tracker | สำรวจ 50 เขตกรุงเทพฯ',
  description: 'Mobile-first interactive map & explorer to track your visits, landmark discoveries, and spots across all 50 districts of Bangkok.',
  keywords: ['Bangkok', 'Districts', 'Khet', 'Bangkok Map', 'Travel Tracker', 'Thailand', 'กรุงเทพมหานคร', '50 เขต'],
  authors: [{ name: 'Bangkok District Tracker' }],
  themeColor: '#0f172a'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen selection:bg-emerald-500 selection:text-white">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
