import type { FilterStats } from '../hooks/useFilterStats'

interface Props {
  stats: FilterStats
}

export function StatsPanel({ stats }: Props) {
  const items = [
    { label: 'Usernames cargados', value: stats.totalItems.toLocaleString(), color: '#f39c12' },
    { label: 'Bits del filtro', value: stats.filterSizeBits.toLocaleString(), color: '#1abc9c' },
    { label: 'Funciones hash', value: stats.hashFunctions.toString(), color: '#3498db' },
    { label: 'Falsos positivos', value: `~${(stats.estimatedFalsePositiveRate * 100).toFixed(4)}%`, color: '#e74c3c' },
  ]

  return (
    <div className="stats-panel">
      {items.map(item => (
        <div key={item.label} className="stat-card">
          <div className="stat-label">{item.label}</div>
          <div className="stat-value" style={{ color: item.color }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}
