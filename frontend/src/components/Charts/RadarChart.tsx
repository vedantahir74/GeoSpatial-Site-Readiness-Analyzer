import { useScoreStore } from '../../store/scoreStore'
import { exportApi } from '../../api/client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

interface RadarChartProps {
  data: Record<string, number>
}

export default function RadarChartComponent({ data }: RadarChartProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
    value: Math.round(value),
    fullMark: 100
  }))

  return (
    <div className="bg-gray-800/50 p-4 rounded-xl">
      <h3 className="text-sm font-medium text-text-primary mb-4">Score Breakdown</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280' }} />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.5}
            />
            <Tooltip 
              contentStyle={{ background: '#1a1d29', border: '1px solid #374151' }}
              labelStyle={{ color: '#f1f5f9' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ScoreHistogram() {
  return (
    <div className="bg-gray-800/50 p-4 rounded-xl">
      <h3 className="text-sm font-medium text-text-primary mb-4">Score Distribution</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[]}>
            <XAxis dataKey="range" tick={{ fill: '#94a3b8' }} />
            <YAxis tick={{ fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ background: '#1a1d29', border: '1px solid #374151' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}