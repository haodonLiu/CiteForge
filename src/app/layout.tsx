import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CiteForge',
  description: 'Multi-agent literature review framework',
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
