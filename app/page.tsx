import { Logo } from '@/components/ui/Logo'

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ background: '#070707' }}
    >
      <Logo size="lg" />
      <p
        className="font-cormorant mt-5 tracking-[0.3em] uppercase"
        style={{
          color: '#C9A84C',
          fontSize: 'clamp(0.7rem, 2vw, 1rem)',
          opacity: 0.7,
        }}
      >
        Intelligence. Transmitted.
      </p>
    </main>
  )
}
