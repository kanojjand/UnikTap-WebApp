import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-white px-4">
      <div className="text-center">
        <p className="text-5xl font-bold text-corpBlue">404</p>
        <h1 className="mt-3 font-bold text-gray-700">Страница не найдена</h1>
        <p className="text-sm text-gray-500 mt-1">Возможно, ссылка устарела</p>
        <Link
          href="/ru"
          className="inline-flex mt-5 bg-corpBlue text-white rounded-xl font-bold py-3 px-6"
        >
          На главную
        </Link>
      </div>
    </div>
  )
}
