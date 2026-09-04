'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { MapPoint } from './university-map'
import type { City } from '@/types/domain'

const UniversityMap = dynamic(() => import('./university-map').then((mod) => mod.UniversityMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[calc(100dvh-160px)] w-full rounded-none" />,
})

/** Leaflet грузится только на странице карты (раздел 13). */
export function MapLoader(props: { points: MapPoint[]; cities: City[]; locale: string }) {
  return <UniversityMap {...props} />
}
