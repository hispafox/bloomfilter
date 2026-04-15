interface Props {
  bits: number[]
  highlightPositions?: number[]
  highlightColor?: string
}

export function BitGridVisualization({
  bits,
  highlightPositions = [],
  highlightColor = '#f1c40f'
}: Props) {
  const cols = 32
  const cellSize = 14
  const gap = 2
  const highlightSet = new Set(highlightPositions.map(p => p % bits.length))

  return (
    <div
      className="bit-grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gap: `${gap}px`,
      }}
    >
      {bits.map((bit, i) => {
        const isHighlight = highlightSet.has(i)
        const isSet = bit === 1
        const background = isHighlight
          ? highlightColor
          : isSet
            ? '#16a085'
            : '#141422'

        return (
          <div
            key={i}
            className="bit-cell"
            title={`Bit ${i}: ${isSet ? '1' : '0'}`}
            style={{
              width: cellSize,
              height: cellSize,
              background,
              transform: isHighlight ? 'scale(1.3)' : 'scale(1)',
              boxShadow: isHighlight ? `0 0 8px ${highlightColor}80` : 'none',
            }}
          />
        )
      })}
    </div>
  )
}
