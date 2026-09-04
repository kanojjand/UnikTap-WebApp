'use client'

import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const KZ_CENTER: [number, number] = [48.02, 66.92]

const pinIcon = L.divIcon({
  className: '',
  html: `<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#1E3A8A;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
})

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => onPick(Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6))),
  })
  return null
}

function Recenter({ position, zoom }: { position: [number, number] | null; zoom: number }) {
  const map = useMap()
  const previous = useRef<string>('')

  useEffect(() => {
    if (!position) return
    const key = position.join(',')
    if (key === previous.current) return
    previous.current = key
    map.setView(position, zoom)
  }, [position, zoom, map])

  return null
}

/** Карта с перетаскиваемым пином. Клик по карте тоже ставит точку. */
export function LocationMap({
  lat,
  lng,
  fallback,
  onPick,
}: {
  lat: number | null
  lng: number | null
  fallback: [number, number] | null
  onPick: (lat: number, lng: number) => void
}) {
  const position = useMemo<[number, number] | null>(
    () => (lat !== null && lng !== null ? [lat, lng] : null),
    [lat, lng],
  )
  const center = position ?? fallback ?? KZ_CENTER
  const zoom = position ? 16 : fallback ? 12 : 5

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-72 w-full rounded-xl z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <Recenter position={position ?? fallback} zoom={zoom} />
      {position ? (
        <Marker
          position={position}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const { lat: newLat, lng: newLng } = event.target.getLatLng()
              onPick(Number(newLat.toFixed(6)), Number(newLng.toFixed(6)))
            },
          }}
        />
      ) : null}
    </MapContainer>
  )
}
