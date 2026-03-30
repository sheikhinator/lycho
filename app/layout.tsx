import type { Metadata } from 'next'
import { Bebas_Neue, Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { CustomCursorLoader } from '@/components/ui/CustomCursorLoader'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
})

const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-cormorant',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
})

export const metadata: Metadata = {
  title: 'LYCHO — Intelligence. Transmitted.',
  description: 'Universal AI agent platform for Pakistani and global businesses.',
  icons: {
    icon: '/lycho-logo.svg',
    shortcut: '/lycho-logo.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${bebasNeue.variable} ${cormorant.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}
      >
        <AuthProvider>
          <ToastProvider>
            <CustomCursorLoader />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
