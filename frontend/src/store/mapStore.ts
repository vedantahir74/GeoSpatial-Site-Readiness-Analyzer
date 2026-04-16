import { create } from 'zustand';
import type { Map as MapLibreMap } from 'maplibre-gl';

interface MapState {
  map: MapLibreMap | null;
  center: [number, number];
  zoom: number;
  clickedPoint: { lat: number; lng: number } | null;
  setMapInstance: (map: MapLibreMap | null) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setClickedPoint: (point: { lat: number; lng: number } | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  map: null,
  center: [72.5714, 23.0225], // [lng, lat] for MapLibre
  zoom: 11,
  clickedPoint: null,
  setMapInstance: (map) => set({ map }),
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setClickedPoint: (clickedPoint) => set({ clickedPoint }),
}));
