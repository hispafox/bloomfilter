const HASH_COLORS = ['#e74c3c', '#2ecc71', '#3498db', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22']
const HASH_NAMES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7']

interface Props {
  positions: number[]
}

export function HashVisualizer({ positions }: Props) {
  if (!positions || positions.length === 0) return null

  return (
    <div className="hash-visualizer">
      {positions.slice(0, 3).map((pos, i) => (
        <div
          key={i}
          className="hash-pill"
          style={{
            background: `${HASH_COLORS[i]}15`,
            border: `1px solid ${HASH_COLORS[i]}40`,
          }}
        >
          <span style={{ color: HASH_COLORS[i], fontWeight: 700 }}>
            {HASH_NAMES[i]}()
          </span>
          <span className="arrow">→</span>
          <span className="position">bit[{pos}]</span>
        </div>
      ))}
      {positions.length > 3 && (
        <div className="hash-pill muted">+{positions.length - 3} más</div>
      )}
    </div>
  )
}
