
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import DeviceModeProvider from '@/providers/DeviceModeProvider';
import BgThemeProvider from '@/providers/BgThemeProvider';
import { NoteProvider } from '@/components/StickyNotes/NoteContainer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Lucid LoFi Space',
  description: 'Your aesthetic focus and relaxation space.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <DeviceModeProvider>
            <BgThemeProvider>
              <NoteProvider>
                {children}
              </NoteProvider>
            </BgThemeProvider>
          </DeviceModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
