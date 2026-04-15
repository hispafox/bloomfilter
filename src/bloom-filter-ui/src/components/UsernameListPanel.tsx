import type { UsernameListItem } from '../hooks/useUsernameList'

interface Props {
  items: UsernameListItem[]
  onPick: (username: string) => void
}

export function UsernameListPanel({ items, onPick }: Props) {
  if (items.length === 0) return null

  return (
    <div>
      <div className="list-header">
        <span className="list-count">{items.length}</span>
        <span className="list-label">usernames registrados — clica para comprobar</span>
      </div>
      <div className="username-pills">
        {items.map((item) => (
          <button
            key={item.username}
            type="button"
            className="username-pill"
            onClick={() => onPick(item.username)}
            title={`Registrado: ${new Date(item.createdAt).toLocaleString()}`}
          >
            {item.username}
          </button>
        ))}
      </div>
    </div>
  )
}
