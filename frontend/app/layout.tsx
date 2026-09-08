import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { PersonaSwitcher } from '@/components/layout/PersonaSwitcher';

export const metadata: Metadata = {
  title: 'Nexora Campus — One Platform for Every Campus Request',
  description: 'Centralized Campus Operations Platform replacing registers, paper workflows, and manual approvals. BPUT Hackathon 2026.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0f1118" />
      </head>
      <body className="min-h-screen bg-[#0f1118] text-[#edeef2] antialiased">
        <AuthProvider>
          {children}
          <PersonaSwitcher />
        </AuthProvider>
      </body>
    </html>
  );
}
