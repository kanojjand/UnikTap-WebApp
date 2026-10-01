'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { MapPoint } from './university-map'
import type { City } from '@/types/domain'

const UniversityMap = dynamic(() => import('./university-map').then((mod) => mod.UniversityMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none md:rounded-2xl" />,
})

/** Leaflet грузится только на странице карты (раздел 13). */
export function MapLoader(props: { points: MapPoint[]; cities: City[]; locale: string }) {
  return <UniversityMap {...props} />
}
