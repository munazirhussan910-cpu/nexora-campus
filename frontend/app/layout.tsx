import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { PersonaSwitcher } from '@/components/layout/PersonaSwitcher';

export const metadata: Metadata = {
  title: 'Nexora Campus — One Platform for Every Campus Request',
  description: 'Centralized Campus Operations Platform replacing registers, paper workflows, and manual approvals. BPUT Hackathon 2026.',
  manifest: '/manifest.json',
  icons: {
    icon: '/Logo.png',
    apple: '/Logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0B0D12" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('nexora-theme');
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = stored === 'dark' || (!stored && prefersDark) || (stored === 'system' && prefersDark);
                  var root = document.documentElement;
                  if (isDark) {
                    root.classList.add('dark');
                    root.classList.remove('light');
                  } else {
                    root.classList.remove('dark');
                    root.classList.add('light');
                  }
                  var meta = document.querySelector('meta[name="theme-color"]');
                  if (meta) {
                    meta.setAttribute('content', isDark ? '#0B0D12' : '#F7F7F4');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <PersonaSwitcher />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
