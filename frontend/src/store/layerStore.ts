import { create } from 'zustand';

interface LayerConfig {
  visible: boolean;
  opacity: number;
}

interface LayerState {
  hexGrid: LayerConfig;
  isochrones: LayerConfig;
  demographics: LayerConfig;
  pois: LayerConfig;
  roads: LayerConfig;
  landUse: LayerConfig;
  toggleLayer: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
}

export const useLayerStore = create<LayerState>((set) => ({
  hexGrid: { visible: true, opacity: 0.7 },
  isochrones: { visible: false, opacity: 0.5 },
  demographics: { visible: false, opacity: 0.6 },
  pois: { visible: false, opacity: 0.8 },
  roads: { visible: false, opacity: 0.5 },
  landUse: { visible: false, opacity: 0.5 },
  toggleLayer: (layerId) =>
    set((state) => ({
      [layerId]: { ...state[layerId as keyof LayerState], visible: !state[layerId as keyof LayerState].visible },
    })),
  setLayerOpacity: (layerId, opacity) =>
    set((state) => ({
      [layerId]: { ...state[layerId as keyof LayerState], opacity },
    })),
}));
