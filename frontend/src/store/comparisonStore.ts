import { create } from 'zustand'

interface ComparisonState {
  savedSites: any[]
  selectedForComparison: number[]
  comparisonResult: any | null
  addSite: (site: any) => void
  removeSite: (id: number) => void
  toggleSelect: (id: number) => void
  setComparisonResult: (result: any) => void
  clearSelection: () => void
}

export const useComparisonStore = create<ComparisonState>((set) => ({
  savedSites: [],
  selectedForComparison: [],
  comparisonResult: null,
  addSite: (site) => set((state) => ({
    savedSites: [...state.savedSites, site]
  })),
  removeSite: (id) => set((state) => ({
    savedSites: state.savedSites.filter((s) => s.id !== id),
    selectedForComparison: state.selectedForComparison.filter((i) => i !== id)
  })),
  toggleSelect: (id) => set((state) => ({
    selectedForComparison: state.selectedForComparison.includes(id)
      ? state.selectedForComparison.filter((i) => i !== id)
      : [...state.selectedForComparison, id]
  })),
  setComparisonResult: (comparisonResult) => set({ comparisonResult }),
  clearSelection: () => set({ selectedForComparison: [], comparisonResult: null }),
}))