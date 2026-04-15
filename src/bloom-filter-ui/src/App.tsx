import { useState } from 'react'
import { useUsernameCheck } from './hooks/useUsernameCheck'
import { useFilterStats } from './hooks/useFilterStats'
import { useVisualize } from './hooks/useVisualize'
import { BitGridVisualization } from './components/BitGridVisualization'
import { HashVisualizer } from './components/HashVisualizer'
import { StatsPanel } from './components/StatsPanel'
import './App.css'

function App() {
  const { username, setUsername, result, loading } = useUsernameCheck(300)
  const stats = useFilterStats(1000)
  const visualize = useVisualize(username, 300)
  const [registerStatus, setRegisterStatus] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)

  const handleRegister = async () => {
    if (!username || username.length < 3) return
    setRegistering(true)
    setRegisterStatus(null)

    try {
      const res = await fetch('/api/username/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      if (res.status === 201) setRegisterStatus('✓ Registrado')
      else if (res.status === 409) setRegisterStatus('✗ Ya existe')
      else setRegisterStatus('Error inesperado')
    } catch {
      setRegisterStatus('Error de conexión')
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Bloom Filter — Username Checker</h1>
        <p className="subtitle">
          Pre-check en microsegundos · .NET 10 + React
        </p>
      </header>

      <section className="check-section">
        <div className="input-group">
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setRegisterStatus(null)
            }}
            placeholder="Escribe un username..."
            className="username-input"
          />
          {loading && <span className="indicator loading">⟳</span>}
          {!loading && result && (
            <span className={`indicator ${result.available ? 'available' : 'taken'}`}>
              {result.available ? '✓' : '✗'}
            </span>
          )}
        </div>

        {result && (
          <div className={`result ${result.available ? 'available' : 'taken'}`}>
            <strong>{result.available ? 'Disponible' : 'No disponible'}</strong>
            <span>{result.note}</span>
          </div>
        )}

        {visualize && visualize.positions.length > 0 && (
          <div className="section">
            <h3>Hashes disparados por "{visualize.username}"</h3>
            <HashVisualizer positions={visualize.positions} />
          </div>
        )}

        <button
          onClick={handleRegister}
          disabled={!username || username.length < 3 || registering}
          className="register-btn"
        >
          {registering ? 'Registrando...' : 'Registrar'}
        </button>

        {registerStatus && (
          <div className={`register-status ${registerStatus.startsWith('✓') ? 'success' : 'error'}`}>
            {registerStatus}
          </div>
        )}
      </section>

      {stats && (
        <section className="stats-section">
          <h2>Estado del filtro (en vivo)</h2>
          <StatsPanel stats={stats} />
          <div className="section">
            <h3>Bit array (muestra de los primeros 256 bits)</h3>
            <BitGridVisualization
              bits={stats.bitsSample}
              highlightPositions={visualize?.positions ?? []}
            />
          </div>
        </section>
      )}
    </div>
  )
}

export default App
