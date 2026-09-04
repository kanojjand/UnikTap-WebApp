'use client'

import dynamic from 'next/dynamic'
import { Crosshair, MapPin, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { City } from '@/types/domain'

const LocationMap = dynamic(() => import('./location-map').then((mod) => mod.LocationMap), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full" />,
})

/**
 * Раздел 8.4 ТЗ: координаты правятся перетаскиванием пина, кликом по карте
 * или руками. Всё три способа пишут в одни и те же поля lat/lng.
 */
export function LocationPicker({
  lat,
  lng,
  city,
  onChange,
}: {
  lat: number | null
  lng: number | null
  city: City | null
  onChange: (patch: { lat: number | null; lng: number | null }) => void
}) {
  const cityCenter: [number, number] | null =
    city?.lat != null && city?.lng != null ? [city.lat, city.lng] : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-corpBlue" aria-hidden />
          Точка на карте
        </p>
        <div className="flex gap-2">
          {cityCenter ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onChange({ lat: cityCenter[0], lng: cityCenter[1] })}
            >
              <Crosshair className="w-4 h-4" aria-hidden />
              В центр города
            </Button>
          ) : null}
          {lat !== null && lng !== null ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ lat: null, lng: null })}>
              <Trash2 className="w-4 h-4" aria-hidden />
              Убрать
            </Button>
          ) : null}
        </div>
      </div>

      <LocationMap
        lat={lat}
        lng={lng}
        fallback={cityCenter}
        onPick={(newLat, newLng) => onChange({ lat: newLat, lng: newLng })}
      />

      <p className="text-xs text-gray-500">
        Кликните по карте, чтобы поставить точку, или перетащите пин. Координаты обновятся сами —
        не забудьте сохранить карточку.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Широта (lat)">
          {({ id }) => (
            <Input
              id={id}
              surface="admin"
              type="number"
              step="0.000001"
              value={lat !== null ? String(lat) : ''}
              onChange={(event) =>
                onChange({ lat: event.target.value ? Number(event.target.value) : null, lng })
              }
            />
          )}
        </Field>
        <Field label="Долгота (lng)">
          {({ id }) => (
            <Input
              id={id}
              surface="admin"
              type="number"
              step="0.000001"
              value={lng !== null ? String(lng) : ''}
              onChange={(event) =>
                onChange({ lat, lng: event.target.value ? Number(event.target.value) : null })
              }
            />
          )}
        </Field>
      </div>
    </div>
  )
}
