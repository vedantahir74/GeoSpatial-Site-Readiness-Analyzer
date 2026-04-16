import { useLayerStore } from '../../store/layerStore'
import { Eye, EyeOff, RotateCcw } from 'lucide-react'

export default function LayerManager() {
  const { layers, toggleLayer, setOpacity, resetLayers } = useLayerStore()

  const layerNames: Record<string, string> = {
    hexGrid: 'H3 Hex Grid',
    demographics: 'Demographics',
    roads: 'Road Network',
    pois: 'Points of Interest',
    landUse: 'Land Use',
    environment: 'Environment',
    isochrones: 'Isochrones',
    clusters: 'Clusters',
    competitors: 'Competitors',
    savedSites: 'Saved Sites',
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-text-primary">Map Layers</h3>
        <button 
          onClick={resetLayers}
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div className="space-y-2">
        {Object.entries(layers).map(([key, { visible, opacity }]) => (
          <div key={key} className="bg-gray-800/50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-primary">{layerNames[key] || key}</span>
              <button 
                onClick={() => toggleLayer(key)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                {visible ? (
                  <Eye className="w-4 h-4 text-accent" />
                ) : (
                  <EyeOff className="w-4 h-4 text-text-secondary" />
                )}
              </button>
            </div>
            {visible && (
              <input
                type="range"
                min="0"
                max="100"
                value={opacity * 100}
                onChange={(e) => setOpacity(key, parseInt(e.target.value) / 100)}
                className="w-full accent-accent"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}