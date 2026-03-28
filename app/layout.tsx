import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Bebas_Neue, Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google'
import { AuthProvider } from '@/components/providers/AuthProvider'
import './globals.css'

const CustomCursor = dynamic(
  () => import('@/components/ui/CustomCursor').then(m => m.CustomCursor),
  { ssr: false }
)

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
          <CustomCursor />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
