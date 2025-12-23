import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UWDO - Universal Welfare and Development Organization',
  description: 'Universal Welfare and Development Organization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

