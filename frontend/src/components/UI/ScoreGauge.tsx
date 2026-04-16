import { motion } from 'framer-motion'

interface ScoreGaugeProps {
  score: number
}

export default function ScoreGauge({ score }: ScoreGaugeProps) {
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

  const circumference = 2 * Math.PI * 45
  const progress = (score / 100) * circumference

  return (
    <div className="flex flex-col items-center p-6 bg-gray-800/50 rounded-xl">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="#2d3748"
            strokeWidth="8"
            fill="none"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="45"
            stroke={getScoreColor(score)}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold"
            style={{ color: getScoreColor(score) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score.toFixed(0)}
          </motion.span>
          <span className="text-xs text-text-secondary">/ 100</span>
        </div>
      </div>
      <motion.div
        className="mt-3 px-4 py-1 rounded-full text-sm font-medium"
        style={{ 
          backgroundColor: getScoreColor(score) + '20',
          color: getScoreColor(score)
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        {getScoreLabel(score)}
      </motion.div>
      <span className="mt-2 text-xs text-text-secondary">Composite Score</span>
    </div>
  )
}