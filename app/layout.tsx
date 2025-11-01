import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grok Advantage',
  description: 'Super Heavy Grok Advantage analyzer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
