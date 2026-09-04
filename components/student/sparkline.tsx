export function Sparkline({
  points,
  width = 220,
  height = 52,
}: {
  points: { year: number; value: number }[]
  width?: number
  height?: number
}) {
  if (points.length < 2) return null
  const sorted = [...points].sort((a, b) => a.year - b.year)
  const values = sorted.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = width / (sorted.length - 1)

  const coords = sorted.map((point, index) => ({
    x: index * step,
    y: height - 8 - ((point.value - min) / span) * (height - 20),
    ...point,
  }))
  const path = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')

  return (
    <figure className="mt-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-14" role="img" aria-label="Динамика проходного балла">
        <polyline points={path} fill="none" stroke="#1E3A8A" strokeWidth="2" strokeLinejoin="round" />
        {coords.map((c) => (
          <circle key={c.year} cx={c.x} cy={c.y} r="2.5" fill="#1E3A8A" />
        ))}
      </svg>
      <figcaption className="flex justify-between text-[10px] text-gray-400">
        {coords.map((c) => (
          <span key={c.year}>
            {c.year}
            <span className="ml-1 text-gray-500 font-medium">{c.value}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
