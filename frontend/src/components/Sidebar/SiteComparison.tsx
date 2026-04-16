import { useEffect, useState } from 'react'
import { useComparisonStore } from '../../store/comparisonStore'
import { siteApi } from '../../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Download, Trash2 } from 'lucide-react'

export default function SiteComparison() {
  const { savedSites, selectedForComparison, toggleSelect, comparisonResult, setComparisonResult } = useComparisonStore()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadSites()
  }, [])

  const loadSites = async () => {
    try {
      const response = await siteApi.getSites()
    } catch (error) {
      console.error('Error loading sites:', error)
    }
  }

  const handleCompare = async () => {
    if (selectedForComparison.length < 2) return
    setIsLoading(true)
    try {
      const response = await siteApi.compareSites(selectedForComparison)
      setComparisonResult(response.data)
    } catch (error) {
      console.error('Error comparing sites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const chartData = comparisonResult?.sites?.map((site: any) => ({
    name: site.site_name || `Site ${site.id}`,
    score: site.composite_score
  })) || []

  return (
    <div className="space-y-4">
      {savedSites.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          <p>No saved sites yet.</p>
          <p className="text-xs mt-2">Click on the map to save sites for comparison.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {savedSites.map((site: any) => (
              <div 
                key={site.id}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                  selectedForComparison.includes(site.id) 
                    ? 'bg-accent/20 border border-accent' 
                    : 'bg-gray-800/50'
                }`}
                onClick={() => toggleSelect(site.id)}
              >
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    checked={selectedForComparison.includes(site.id)}
                    onChange={() => {}}
                    className="accent-accent"
                  />
                  <span className="text-sm text-text-primary">{site.site_name}</span>
                </div>
                <span className="text-sm font-medium text-accent">
                  {site.composite_score?.toFixed(1) || '--'}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleCompare}
            disabled={selectedForComparison.length < 2 || isLoading}
            className="w-full py-2 bg-accent hover:bg-accent/80 disabled:bg-gray-600 text-white rounded-lg font-medium"
          >
            {isLoading ? 'Comparing...' : 'Compare Selected'}
          </button>

          {comparisonResult && (
            <div className="space-y-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-text-primary mb-4">Comparison Results</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8' }} width={80} />
                      <Tooltip contentStyle={{ background: '#1a1d29', border: '1px solid #374151' }} />
                      <Bar dataKey="score" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-text-secondary">Criterion</th>
                      {comparisonResult.sites?.map((site: any) => (
                        <th key={site.id} className="text-left py-2 text-text-primary">
                          {site.site_name || `Site ${site.id}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['composite', 'demographics', 'transport', 'poi', 'land_use', 'environment'].map((criterion) => (
                      <tr key={criterion} className="border-b border-gray-700/50">
                        <td className="py-2 text-text-secondary capitalize">{criterion}</td>
                        {comparisonResult.sites?.map((site: any) => {
                          const value = criterion === 'composite' 
                            ? site.composite_score 
                            : site.sub_scores?.[criterion]
                          const isWinner = comparisonResult.rankings?.[criterion]?.[0] === site.id
                          return (
                            <td key={site.id} className="py-2">
                              <span className={isWinner ? 'text-success font-bold' : 'text-text-primary'}>
                                {value?.toFixed(1) || '--'}
                              </span>
                              {isWinner && <span className="ml-1 text-success">★</span>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}