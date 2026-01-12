"use client";

import ESignDocument from '@/components/ESignDocument';
import { NextIntlClientProvider } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useMessages } from 'next-intl';

export default function ESignPage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1]; // Extract locale from the URL
  const messages = useMessages(); // Auto-fetch messages

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ESignDocument />
    </NextIntlClientProvider>
  );
}
