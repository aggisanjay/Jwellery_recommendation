import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jewelry Visual Matching Atelier | AI Necklace to Earrings Recommender',
  description: 'AI-powered visual matching for Indian ethnic jewelry combining deep CLIP ViT-B/32 vision embeddings with LAB color palette harmonization.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-atelier-950 text-gold-100 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
