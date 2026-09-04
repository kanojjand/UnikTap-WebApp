export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle ? <p className="text-gray-500 mt-2">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function BigStat({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: React.ReactNode
  hint?: string
  tone?: 'default' | 'warning'
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
      <p className="text-[10px] uppercase font-bold text-gray-400">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${tone === 'warning' ? 'text-yellow-600' : 'text-corpBlue'}`}>{value}</p>
      {hint ? <p className="text-xs text-gray-400 mt-1">{hint}</p> : null}
    </div>
  )
}
