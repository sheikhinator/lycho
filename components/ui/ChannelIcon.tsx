'use client'

import { FaWhatsapp, FaInstagram, FaFacebook } from 'react-icons/fa'
import { MdEmail, MdLanguage, MdSms, MdPhone } from 'react-icons/md'

const CHANNEL_CONFIG: Record<string, { Icon: React.ElementType; color: string; label: string }> = {
  whatsapp:  { Icon: FaWhatsapp,   color: '#25D366', label: 'WhatsApp' },
  email:     { Icon: MdEmail,      color: '#C9A84C', label: 'Email' },
  web:       { Icon: MdLanguage,   color: '#3498db', label: 'Web' },
  sms:       { Icon: MdSms,        color: '#9b59b6', label: 'SMS' },
  voice:     { Icon: MdPhone,      color: '#1abc9c', label: 'Voice' },
  instagram: { Icon: FaInstagram,  color: '#E1306C', label: 'Instagram' },
  facebook:  { Icon: FaFacebook,   color: '#1877F2', label: 'Facebook' },
}

interface ChannelIconProps {
  channel: string
  size?: number
  showLabel?: boolean
  className?: string
}

export function ChannelIcon({ channel, size = 16, showLabel = false, className = '' }: ChannelIconProps) {
  const config = CHANNEL_CONFIG[channel.toLowerCase()]
  if (!config) return null
  const { Icon, color, label } = config

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={label}
    >
      <Icon size={size} style={{ color }} />
      {showLabel && (
        <span className="text-xs font-sans" style={{ color }}>
          {label}
        </span>
      )}
    </span>
  )
}
