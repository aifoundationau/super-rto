import type { Metadata } from 'next';
import './globals.css';
import { GoogleTranslate } from '@/components/GoogleTranslate';

export const metadata: Metadata = {
  title: 'EduPulse AI / Super RTO - Admissions, Compliance & Course Platform',
  description: 'Unified Registered Training Organisation & Enterprise Learning Management System combining university FAQs, course descriptions, individual unit syllabuses, LMS course builder, student application form filling, and Google Calendar event registrations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <body className="antialiased selection:bg-indigo-500 selection:text-white" suppressHydrationWarning>
        <GoogleTranslate />
        {children}
      </body>
    </html>
  );
}
