import Image from 'next/image'

export interface TopBarProps {
  title?: string
  userInitials?: string
  userAvatar?: string
}

export function TopBar({
  title,
  userInitials = 'LY',
  userAvatar,
}: TopBarProps) {
  return (
    <header className="h-14 bg-deep border-b border-border flex items-center px-6 gap-4 shrink-0">
      <span className="font-bebas text-xl tracking-[0.2em] text-gold">LYCHO</span>

      <div className="flex-1 flex justify-center">
        {title && (
          <h1 className="font-cormorant text-base text-ivory tracking-widest">
            {title}
          </h1>
        )}
      </div>

      <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-gold text-xs font-bold overflow-hidden shrink-0">
        {userAvatar ? (
          <Image src={userAvatar} alt="avatar" width={32} height={32} className="object-cover" />
        ) : (
          userInitials
        )}
      </div>
    </header>
  )
}
