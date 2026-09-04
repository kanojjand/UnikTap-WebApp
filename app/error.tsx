'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-white px-4">
      <div className="text-center">
        <h1 className="font-bold text-gray-700 text-lg">Что-то пошло не так</h1>
        <p className="text-sm text-gray-500 mt-1">Мы уже знаем о проблеме</p>
        <button onClick={reset} className="mt-5 bg-corpBlue text-white rounded-xl font-bold py-3 px-6">
          Повторить
        </button>
      </div>
    </div>
  )
}
