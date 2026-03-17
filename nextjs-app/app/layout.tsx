import type { Metadata, Viewport } from 'next';
import AppProviders from './AppProviders';

export const metadata: Metadata = {
  title: 'Sakash Voice - Speech Practice App',
  description: 'Practice impromptu speaking with real-time AI feedback for Toastmasters Table Topics',
  robots: 'index, follow',
  authors: [{ name: 'Sakash Team' }],
  keywords: ['speech', 'practice', 'toastmasters', 'impromptu', 'ai', 'feedback', 'speaking'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={metadata.description as string} />
      </head>
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
