'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Crosshair, Loader2, Navigation, Star, X } from 'lucide-react'
import { buttonClass } from '@/components/ui/button-styles'
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
  const size = label ? 40 : 28
  return L.divIcon({
    className: '',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${color};color:#fff;font:700 13px/1 Inter,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.35);border:2px solid #fff">${label ?? ''}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function ZoomWatcher({ onZoom }: { onZoom: (zoom: number) => void }) {
  useMapEvents({ zoomend: (event) => onZoom(event.target.getZoom()) })
  return null
}

/** Нажатие на кружок с числом приближает карту к городу — раньше он ничего не делал. */
function ClusterMarker({ city, count }: { city: City; count: number }) {
  const map = useMap()
  return (
    <Marker
      position={[city.lat as number, city.lng as number]}
      icon={pinIcon(PIN_COLORS.default, String(count))}
      eventHandlers={{ click: () => map.flyTo([city.lat as number, city.lng as number], 11, { duration: 0.6 }) }}
    />
  )
}

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, 12, { duration: 0.8 })
  }, [map, position])
  return null
}

export interface MapPoint {
  university: University
  chance?: Chance
}

export function UniversityMap({ points, cities, locale }: { points: MapPoint[]; cities: City[]; locale: string }) {
  const t = useTranslations('map')
  const tc = useTranslations('chance')
  const [zoom, setZoom] = useState(5)
  const [selected, setSelected] = useState<MapPoint | null>(null)
  const [me, setMe] = useState<[number, number] | null>(null)
  const [locating, setLocating] = useState(false)

  // Кластеризация: при малом зуме пины схлопываются в кружок по городу
  const clusters = useMemo(() => {
    if (zoom >= 8) return null
    const byId = new Map(cities.map((city) => [city.id, city]))
    const groups = new Map<number, { city: City; count: number }>()
    for (const point of points) {
      const city = byId.get(point.university.city_id as number)
      if (!city?.lat || !city?.lng) continue
      const entry = groups.get(city.id)
      if (entry) entry.count += 1
      else groups.set(city.id, { city, count: 1 })
    }
    return [...groups.values()]
  }, [points, cities, zoom])

  const hasChances = points.some((point) => point.chance)

  function locate() {
    if (!navigator.geolocation) {
      toast.error(t('geoDenied'))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        setMe([position.coords.latitude, position.coords.longitude])
      },
      () => {
        setLocating(false)
        toast.error(t('geoDenied'))
      },
      { timeout: 8000 },
    )
  }

  return (
    <div className="relative h-full isolate md:rounded-2xl md:border md:border-line overflow-hidden">
      <MapContainer center={KZ_CENTER} zoom={5} scrollWheelZoom className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomWatcher onZoom={setZoom} />
        <FlyTo position={me} />

        {clusters
          ? clusters.map(({ city, count }) => <ClusterMarker key={city.id} city={city} count={count} />)
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
        type="button"
        onClick={locate}
        aria-label={t('here')}
        title={t('here')}
        className="absolute top-3 right-3 z-[400] w-12 h-12 bg-surface text-primary-ink rounded-xl shadow-lift border border-line flex items-center justify-center"
      >
        {locating ? (
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
        ) : (
          <Crosshair className="w-5 h-5" aria-hidden />
        )}
      </button>

      {/* Легенда: что значат цвета пинов */}
      {hasChances && !selected ? (
        <ul className="absolute bottom-3 left-3 z-[400] bg-surface/95 backdrop-blur rounded-xl shadow-lift border border-line px-3 py-2 space-y-1 text-sm text-body">
          {(['high', 'medium', 'low'] as const).map((key) => (
            <li key={key} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: PIN_COLORS[key] }} aria-hidden />
              {tc(key)}
            </li>
          ))}
        </ul>
      ) : null}

      {selected ? (
        <div className="absolute bottom-3 inset-x-3 md:right-auto md:w-96 z-[400] bg-surface rounded-2xl shadow-modal border border-line p-4 animate-fade-in">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[16px] text-ink leading-snug">
                {pick(selected.university as unknown as Record<string, unknown>, 'name', locale)}
              </p>
              <p className="text-sm text-muted mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" fill="currentColor" strokeWidth={0} aria-hidden />
                  {Number(selected.university.rating).toFixed(1)}
                </span>
                {selected.university.min_fee ? (
                  <span>{t('feeFrom', { value: formatMoney(selected.university.min_fee, locale) })}</span>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Закрыть"
              className="w-11 h-11 -mr-2 -mt-2 rounded-full flex items-center justify-center text-muted hover:bg-subtle shrink-0"
            >
              <X className="w-5 h-5" aria-hidden />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <Link
              href={`/universities/${selected.university.slug}`}
              className={`${buttonClass('primary', 'sm')} flex-1`}
            >
              {t('details')}
            </Link>
            <a
              href={`https://2gis.kz/geo/${selected.university.lng},${selected.university.lat}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('route_click', {}, { universityId: selected.university.id })}
              className={buttonClass('secondary', 'sm')}
            >
              <Navigation className="w-4 h-4" aria-hidden />
              {t('route')}
            </a>
          </div>
        </div>
      ) : null}
    </div>
  )
}
