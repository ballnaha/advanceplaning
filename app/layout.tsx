import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import MuiProvider from "./MuiProvider";
import ApplicationHeader from "./components/ApplicationHeader";
import MainContent from "./components/MainContent";

const sarabun = Sarabun({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  subsets: ['thai', 'latin'],
  display: 'swap',
  variable: '--font-sarabun',
});

export const metadata: Metadata = {
  title: "PSC Planing",
  description: "Factory planning dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={sarabun.variable}
      style={{ height: '100%', width: '100%' }}
    >
      <body
        className={sarabun.className}
        style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', margin: 0 }}
      >
        <MuiProvider>
          <ApplicationHeader />
          <MainContent>{children}</MainContent>
          <footer
            style={{
              flexShrink: 0,
              padding: '12px 20px',
              borderTop: '1px solid rgba(15, 23, 42, 0.08)',
              color: '#64748b',
              background: 'rgba(255, 255, 255, 0.55)',
              textAlign: 'center',
              fontSize: '12px',
            }}
          >
            © {new Date().getFullYear()} PSC Planing
          </footer>
        </MuiProvider>
      </body>
    </html>
  );
}
