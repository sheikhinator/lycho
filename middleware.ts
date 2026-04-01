import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/agents', '/conversations', '/billing', '/settings', '/onboarding']

// Public routes — skip Supabase session check entirely
// /master handles its own auth via master_session cookie in app/master/layout.tsx
const PUBLIC = ['/', '/login', '/signup', '/forgot-password', '/developers', '/onboarding', '/widget', '/components', '/master', '/master-login', '/demo', '/activate', '/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip session check for explicitly public routes
  const isPublic = PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isPublic) {
    const h = new Headers(request.headers)
    h.set('x-current-path', pathname)
    return NextResponse.next({ request: { headers: h } })
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-current-path', pathname)
  const response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set(name: string, value: string, options: any) {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        remove(name: string, options: any) {
          request.cookies.set(name, '')
          response.cookies.set(name, '', options)
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const isProtected = PROTECTED.some(p => pathname.startsWith(p))

  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
