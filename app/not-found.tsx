import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-canvas px-4">
      <div className="text-center">
        <p className="text-5xl font-bold text-primary-ink">404</p>
        <h1 className="mt-3 font-bold text-ink">Страница не найдена</h1>
        <p className="text-sm text-muted mt-1">Возможно, ссылка устарела</p>
        <Link
          href="/ru"
          className="inline-flex mt-5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold py-3 px-6"
        >
          На главную
        </Link>
      </div>
    </div>
  )
}
