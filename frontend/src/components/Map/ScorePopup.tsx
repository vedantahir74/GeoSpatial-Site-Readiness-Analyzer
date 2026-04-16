import { X, MapPin, Clock } from 'lucide-react'
import { useScoreStore } from '../../store/scoreStore'
import { motion } from 'framer-motion'
import { scoreApi } from '../../api/client'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface ScorePopupProps {
  lat: number
  lng: number
  score?: any
  onClose: () => void
}

export default function ScorePopup({ lat, lng, score, onClose }: ScorePopupProps) {
  const { isLoading, setIsochrones } = useScoreStore()
  const [showIsochrones, setShowIsochrones] = useState(false)

  const getScoreColor = (value: number) => {
    if (value >= 85) return '#15803d'
    if (value >= 70) return '#22c55e'
    if (value >= 50) return '#eab308'
    if (value >= 30) return '#f97316'
    return '#ef4444'
  }

  const getScoreLabel = (value: number) => {
    if (value >= 85) return 'Excellent'
    if (value >= 70) return 'Good'
    if (value >= 50) return 'Fair'
    if (value >= 30) return 'Poor'
    return 'Very Poor'
  }

  const handleShowIsochrones = async () => {
    setShowIsochrones(true)
    try {
      const response = await scoreApi.getIsochrone(lat, lng, ['drive'], [10, 20, 30])
      setIsochrones(response.data)
      toast.success('Isochrones loaded')
    } catch (error) {
      toast.error('Failed to load isochrones')
    }
  }

  const handleSaveSite = () => {
    toast.success('Site saved! Check the sidebar for details.')
    onClose()
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 left-4 z-50 w-80 bg-surface rounded-xl shadow-2xl border border-gray-700 overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 bg-accent/20 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-accent" />
          <span className="text-sm text-text-secondary">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
          <X className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : score ? (
          <>
            <div className="text-center mb-4">
              <div 
                className="text-5xl font-bold mb-2"
                style={{ color: getScoreColor(score.composite_score) }}
              >
                {score.composite_score.toFixed(1)}
              </div>
              <div 
                className="text-sm font-medium px-3 py-1 rounded-full inline-block"
                style={{ 
                  backgroundColor: getScoreColor(score.composite_score) + '20',
                  color: getScoreColor(score.composite_score)
                }}
              >
                {getScoreLabel(score.composite_score)}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {Object.entries(score.sub_scores || {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary capitalize">{key}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${value}%`,
                          backgroundColor: getScoreColor(value as number)
                        }}
                      />
                    </div>
                    <span className="text-sm text-text-primary w-8">{(value as number).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>

            {score.metadata && (
              <div className="text-xs text-text-secondary space-y-1 mb-4 bg-gray-800/50 p-2 rounded">
                <div>Highway: {score.metadata.highway_distance_m?.toFixed(0)}m</div>
                <div>Competitors 1km: {score.metadata.competitors_within_1km}</div>
                <div>Population 5km: {score.metadata.population_within_5km?.toLocaleString()}</div>
              </div>
            )}

            <div className="flex gap-2">
              <button 
                onClick={handleSaveSite}
                className="flex-1 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Save Site
              </button>
              <button 
                onClick={handleShowIsochrones}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Clock className="w-4 h-4" />
                Isochrones
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-text-secondary">
            Click on the map to get a score
          </div>
        )}
      </div>
    </motion.div>
  )
}