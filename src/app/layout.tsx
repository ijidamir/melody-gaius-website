import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Melody Gaius Danjuma — Humanitarian & Counselor',
  description: 'Faith, food and healing: outreach, counseling and community support across northeastern Nigeria.',
  robots: { index: true, follow: true },
};
const themeScript = `try { const t=localStorage.getItem('melody-theme'); if(t==='light')document.documentElement.classList.add('light'); }catch(e){}`;
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{__html:themeScript}} /></head>
    <body className="min-h-screen antialiased">{children}</body>
  </html>;
}
