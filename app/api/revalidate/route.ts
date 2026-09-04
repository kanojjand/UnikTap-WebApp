import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

/** Точечная инвалидация ISR из админки (разделы 8.11 и 13). */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret') ?? request.headers.get('x-revalidate-secret')
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 401 })
  }

  const slug = request.nextUrl.searchParams.get('slug')
  const paths = slug
    ? [`/ru/universities/${slug}`, `/kk/universities/${slug}`, '/ru', '/kk']
    : ['/ru', '/kk']

  for (const path of paths) revalidatePath(path)
  return NextResponse.json({ ok: true, revalidated: paths, now: Date.now() })
}
