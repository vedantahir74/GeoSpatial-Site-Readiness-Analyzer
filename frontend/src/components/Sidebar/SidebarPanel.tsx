import { useState } from 'react'
import { 
  Score, Sliders, Layers, GitCompare, PenTool, 
  ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScoreStore } from '../../store/scoreStore'
import { useLayerStore } from '../../store/layerStore'
import { useMapStore } from '../../store/mapStore'
import ScoreGauge from '../UI/ScoreGauge'
import RadarChart from '../Charts/RadarChart'
import WeightControls from './WeightControls'
import LayerManager from './LayerManager'
import SiteComparison from './SiteComparison'

const tabs = [
  { id: 'score', label: 'Score', icon: Score },
  { id: 'weights', label: 'Weights', icon: Sliders },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'compare', label: 'Compare', icon: GitCompare },
  { id: 'draw', label: 'Draw', icon: PenTool },
]

export default function SidebarPanel() {
  const [isOpen, setIsOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('score')
  const { activeScore } = useScoreStore()
  const { layers } = useLayerStore()
  const { drawnPolygon, setDrawnPolygon } = useMapStore()

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 350, opacity: 0 }}
            className="w-[350px] h-full bg-surface border-l border-gray-700 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h1 className="text-lg font-bold text-text-primary">Site Analyzer</h1>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="flex border-b border-gray-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 text-xs transition-colors ${
                    activeTab === tab.id 
                      ? 'text-accent bg-accent/10 border-b-2 border-accent' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'score' && (
                <div className="space-y-4">
                  {activeScore ? (
                    <>
                      <ScoreGauge score={activeScore.composite_score} />
                      <RadarChart data={activeScore.sub_scores} />
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <h3 className="text-sm font-medium text-text-primary mb-2">Explanations</h3>
                        <div className="space-y-2 text-xs text-text-secondary">
                          {Object.entries(activeScore.explanations || {}).map(([key, value]) => (
                            <div key={key}>
                              <span className="capitalize font-medium text-text-primary">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                      </div>
                      {activeScore.threshold_violations?.length > 0 && (
                        <div className="bg-danger/20 p-3 rounded-lg">
                          <h3 className="text-sm font-medium text-danger mb-1">Threshold Violations</h3>
                          <ul className="text-xs text-danger/80">
                            {activeScore.threshold_violations.map((v: string, i: number) => (
                              <li key={i}>• {v}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-text-secondary">
                      <Score className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Click on the map to get a site score</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'weights' && <WeightControls />}
              {activeTab === 'layers' && <LayerManager />}
              {activeTab === 'compare' && <SiteComparison />}
              
              {activeTab === 'draw' && (
                <div className="space-y-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-text-primary mb-2">Draw Polygon</h3>
                    <p className="text-xs text-text-secondary mb-4">
                      Click on the map to start drawing a polygon area for analysis.
                    </p>
                    <button className="w-full py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-medium">
                      Start Drawing
                    </button>
                  </div>
                  {drawnPolygon && (
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-text-primary">Polygon Drawn</h3>
                        <button 
                          onClick={() => setDrawnPolygon(null)}
                          className="p-1 hover:bg-gray-700 rounded"
                        >
                          <X className="w-4 h-4 text-text-secondary" />
                        </button>
                      </div>
                      <button className="w-full py-2 bg-success/20 hover:bg-success/30 text-success rounded-lg text-sm font-medium">
                        Find Best Sites
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-40 p-2 bg-surface border border-gray-700 border-r-0 rounded-l-lg hover:bg-gray-700"
        >
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </button>
      )}
    </>
  )
}