import { useState } from 'react'
import { useUsernameCheck } from './hooks/useUsernameCheck'
import './App.css'

function App() {
  const { username, setUsername, result, loading } = useUsernameCheck(300)
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

      if (res.status === 201) {
        setRegisterStatus('✓ Registrado correctamente')
      } else if (res.status === 409) {
        setRegisterStatus('✗ Username no disponible')
      } else {
        setRegisterStatus('Error inesperado')
      }
    } catch {
      setRegisterStatus('Error de conexión')
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="container">
      <h1>Username Checker</h1>
      <p className="subtitle">Bloom Filter + .NET 10 — check en microsegundos</p>

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
    </div>
  )
}

export default App
