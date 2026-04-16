import { useState } from 'react'
import { useScoreStore } from '../../store/scoreStore'
import { exportApi } from '../../api/client'
import toast from 'react-hot-toast'
import { RefreshCw } from 'lucide-react'

const presetWeights: Record<string, Record<string, number>> = {
  retail: { demographics: 35, transport: 25, poi: 20, land_use: 10, environment: 10 },
  ev_charging: { demographics: 20, transport: 40, poi: 15, land_use: 15, environment: 10 },
  warehouse: { demographics: 10, transport: 45, poi: 10, land_use: 25, environment: 10 },
  telecom: { demographics: 30, transport: 15, poi: 5, land_use: 30, environment: 20 },
}

export default function WeightControls() {
  const { weights, setWeights, useCase, setUseCase } = useScoreStore()
  const [isComputing, setIsComputing] = useState(false)

  const handlePresetChange = (useCase: string) => {
    setUseCase(useCase)
    if (presetWeights[useCase]) {
      setWeights(presetWeights[useCase])
    }
  }

  const handleWeightChange = (key: string, value: number) => {
    setWeights({ ...weights, [key]: value })
  }

  const handleRecompute = async () => {
    setIsComputing(true)
    toast.loading('Recomputing hex grid...', { id: 'recompute' })
    
    setTimeout(() => {
      setIsComputing(false)
      toast.success('Hex grid updated!', { id: 'recompute' })
    }, 2000)
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-800/50 p-4 rounded-lg">
        <label className="text-sm text-text-secondary mb-2 block">Use Case Preset</label>
        <select 
          value={useCase}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-text-primary"
        >
          <option value="retail">Retail Store</option>
          <option value="ev_charging">EV Charging Station</option>
          <option value="warehouse">Warehouse/Logistics</option>
          <option value="telecom">Telecom Tower</option>
        </select>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-text-primary">Layer Weights</h3>
        {Object.entries(weights).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary capitalize">{key.replace('_', ' ')}</span>
              <span className="text-text-primary">{value}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) => handleWeightChange(key, parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
        ))}
      </div>

      <div className="bg-gray-800/50 p-4 rounded-lg space-y-3">
        <h3 className="text-sm font-medium text-text-primary">Hard Constraints</h3>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" className="accent-accent" />
          Exclude flood zones
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" className="accent-accent" />
          Only commercial zones
        </label>
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">Min population (5km):</label>
          <input 
            type="number" 
            placeholder="50000"
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-text-primary text-sm w-24"
          />
        </div>
      </div>

      <button
        onClick={handleRecompute}
        disabled={isComputing}
        className="w-full py-3 bg-accent hover:bg-accent/80 disabled:bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${isComputing ? 'animate-spin' : ''}`} />
        {isComputing ? 'Computing...' : 'Recompute Scores'}
      </button>
    </div>
  )
}