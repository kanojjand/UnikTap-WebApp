'use client'

import { useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useTranslations } from 'next-intl'
import { Crosshair, Navigation, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { track } from '@/lib/analytics'
import { formatMoney, pick } from '@/lib/utils'
import type { Chance } from '@/lib/ent'
import type { City, University } from '@/types/domain'
import 'leaflet/dist/leaflet.css'

const KZ_CENTER: [number, number] = [48.02, 66.92]

const PIN_COLORS: Record<string, string> = {
  high: '#16a34a',
  medium: '#eab308',
  low: '#dc2626',
  below_threshold: '#94a3b8',
  default: '#1E3A8A',
}

function pinIcon(color: string, label?: string) {
  return L.divIcon({
    className: '',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${label ? 34 : 26}px;height:${label ? 34 : 26}px;border-radius:50%;background:${color};color:#fff;font:700 11px/1 Inter,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid #fff">${label ?? ''}</span>`,
    iconSize: label ? [34, 34] : [26, 26],
    iconAnchor: label ? [17, 17] : [13, 13],
  })
}

function ZoomWatcher({ onZoom }: { onZoom: (zoom: number) => void }) {
  useMapEvents({ zoomend: (event) => onZoom(event.target.getZoom()) })
  return null
}

export interface MapPoint {
  university: University
  chance?: Chance
}

export function UniversityMap({
  points,
  cities,
  locale,
}: {
  points: MapPoint[]
  cities: City[]
  locale: string
}) {
  const t = useTranslations('map')
  const [zoom, setZoom] = useState(5)
  const [selected, setSelected] = useState<MapPoint | null>(null)
  const [me, setMe] = useState<[number, number] | null>(null)

  // Кластеризация: при малом зуме пины схлопываются в кружок по городу
  const clusters = useMemo(() => {
    if (zoom >= 8) return null
    const map = new Map<number, { city: City; count: number }>()
    for (const point of points) {
      const city = cities.find((item) => item.id === point.university.city_id)
      if (!city?.lat || !city?.lng) continue
      const entry = map.get(city.id)
      if (entry) entry.count += 1
      else map.set(city.id, { city, count: 1 })
    }
    return [...map.values()]
  }, [points, cities, zoom])

  function locate() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => setMe([position.coords.latitude, position.coords.longitude]),
      () => setMe(null),
      { timeout: 8000 },
    )
  }

  return (
    <div className="relative h-[calc(100dvh-160px)]">
      <MapContainer center={KZ_CENTER} zoom={5} scrollWheelZoom className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomWatcher onZoom={setZoom} />

        {clusters
          ? clusters.map(({ city, count }) => (
              <Marker
                key={city.id}
                position={[city.lat as number, city.lng as number]}
                icon={pinIcon(PIN_COLORS.default, String(count))}
              />
            ))
          : points.map((point) =>
              point.university.lat && point.university.lng ? (
                <Marker
                  key={point.university.id}
                  position={[point.university.lat, point.university.lng]}
                  icon={pinIcon(PIN_COLORS[point.chance ?? 'default'])}
                  eventHandlers={{
                    click: () => {
                      setSelected(point)
                      track('map_pin_click', {}, { universityId: point.university.id })
                    },
                  }}
                />
              ) : null,
            )}

        {me ? <Marker position={me} icon={pinIcon('#0ea5e9')} /> : null}
      </MapContainer>

      <button
        onClick={locate}
        aria-label={t('here')}
        className="absolute top-4 right-4 z-[400] bg-white rounded-xl shadow-card p-3 text-corpBlue"
      >
        <Crosshair className="w-5 h-5" aria-hidden />
      </button>

      {selected ? (
        <div className="absolute bottom-4 inset-x-4 z-[400] bg-white rounded-2xl shadow-modal p-4">
          <p className="font-bold text-sm text-gray-900">
            {pick(selected.university as unknown as Record<string, unknown>, 'name', locale)}
          </p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400" fill="currentColor" strokeWidth={0} aria-hidden />
              {Number(selected.university.rating).toFixed(1)}
            </span>
            {selected.university.min_fee ? <span>от {formatMoney(selected.university.min_fee, locale)}</span> : null}
          </p>
          <div className="flex gap-2 mt-3">
            <Link href={`/universities/${selected.university.slug}`} className="flex-1">
              <Button fullWidth size="sm">
                {t('details')}
              </Button>
            </Link>
            <a
              href={`https://2gis.kz/geo/${selected.university.lng},${selected.university.lat}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('route_click', {}, { universityId: selected.university.id })}
            >
              <Button variant="secondary" size="sm">
                <Navigation className="w-4 h-4" aria-hidden />
                {t('route')}
              </Button>
            </a>
          </div>
        </div>
      ) : null}
    </div>
  )
}
