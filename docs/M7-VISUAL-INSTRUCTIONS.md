# INSTRUCCIONES PARA CLAUDE CODE — Módulo 7: Visual Upgrade (Bonus)

## Contexto

Este documento contiene las instrucciones para generar el **Módulo 7 (bonus)** del curso "GitHub Copilot: Skills, Agents y MCP". Parte del estado del repo al final del M6: un proyecto funcional pero visualmente soso.

**El objetivo pedagógico del M7 es distinto al de M1–M6**:

- M1–M6 enseñan a **crear** con Copilot (scaffold, skills, agents, MCP).
- M7 enseña a **iterar sobre un proyecto existente** usando los mismos skills y agents, y a **alimentar a Copilot con un artefacto de referencia** (el demo `.jsx`) como fuente de diseño.

Es un capítulo opcional / post-course follow-up de ~15-20 min que se graba como sesión independiente. El alumno debe haber terminado el M6 antes.

---

## Precondiciones

Antes de empezar, el repo debe estar en:

- Rama activa: `module-06/complete` (o posterior).
- `dotnet build` limpio, `dotnet test` verde, `npm run build` OK.
- El archivo `demo/bloom-filter-demo.jsx` existe en el repo (ya está desde `main`).
- Los 3 agents del M4 están disponibles (`.github/agents/*.agent.md`).
- Los 3 skills del M3 están disponibles (`.github/skills/*/SKILL.md`).

Si alguna de estas condiciones no se cumple, **PARAR** y avisar. No improvisar.

---

## Estrategia de rama y commits

```
module-06/complete
  └── module-07/visual    ← Bonus: visual upgrade
       └── (merge a main tras aprobación)
```

Un solo commit por sub-paso (5 commits en total). Todos los mensajes con `refs #9` (issue tracking).

---

## PASO 0 — Crear la rama

```bash
git checkout module-06/complete
git pull
git checkout -b module-07/visual
```

---

## PASO 1 — Nuevo skill `visual-design`

Crear `.github/skills/visual-design/SKILL.md`:

```markdown
---
name: visual-design
description: >
  Sistema de diseño del proyecto Bloom Filter, basado en la estética del
  demo interactivo (demo/bloom-filter-demo.jsx). Usa este skill cuando
  necesites crear o modificar componentes React visuales: paleta de
  colores, tipografía, cards, animaciones, visualización del bit array,
  panel de stats, o cualquier elemento de UI pedagógico sobre el
  Bloom Filter.
---

# Sistema de diseño — Bloom Filter Course

La fuente de verdad del diseño es el prototipo interactivo `demo/bloom-filter-demo.jsx`.
Ese archivo implementa el Bloom Filter en JS puro y lo envuelve en 8 componentes
pedagógicos. En el frontend real (src/bloom-filter-ui/), esos componentes deben
portarse a TypeScript y conectarse al API .NET.

## Paleta de colores

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0d0d17` | Fondo general |
| `--surface` | `#141422` | Cards, inputs |
| `--surface-alt` | `#0f0f1a` | Paneles secundarios |
| `--border` | `#1a1a2e` | Bordes sutiles |
| `--text` | `#ccd6f6` | Texto principal |
| `--text-muted` | `#8892b0` / `#5a6380` | Labels, subtítulos |
| `--teal` | `#1abc9c` / `#16a085` | Acento principal, bits activos |
| `--green` | `#2ecc71` | Disponible, éxito |
| `--red` | `#e74c3c` | Ocupado, error, hash #1 |
| `--blue` | `#3498db` | Hash #2, info |
| `--orange` | `#f39c12` | Hash #3, warning |
| `--yellow` | `#f1c40f` | Highlight temporal |

## Tipografía

- UI general: `'Segoe UI', system-ui, sans-serif`
- Monospace (números, código, hashes): `'JetBrains Mono', 'Fira Code', monospace`
- Labels de métricas: uppercase, `letter-spacing: 0.5px`, 11px

## Componentes pedagógicos a portar

### 1. `BitGridVisualization`

Malla de celdas que representa el bit array. Props:
- `bits: number[]` — array de 256 valores 0/1 (muestra del filtro real)
- `highlightPositions?: number[]` — posiciones a resaltar (ej: hash de un username)
- `highlightColor?: string`

Layout: grid 32×8 celdas de 14×14 px, gap 2 px. Celda activa = teal, inactiva =
surface-alt, highlight = yellow con scale(1.3) y box-shadow glow.

### 2. `HashVisualizer`

Muestra los 3 hashes disparados por un username. Props:
- `positions: number[]` — 3 posiciones (una por hash)

Cada hash en una pill con color distinto (rojo, verde, azul) y formato
`hash_name() → bit[N]`.

### 3. `StatsPanel`

Grid 2×2 con 4 métricas. Props:
- `stats: { totalItems, filterSizeBits, hashFunctions, estimatedFillRatio, estimatedFalsePositiveRate }`

Cada card: label pequeño uppercase + valor grande en JetBrains Mono con color temático.

### 4. `ResultBadge`

Badge de disponible/ocupado con fondo teñido (verde oscuro o rojo oscuro) y
descripción ("Ningún bit coincide → 100% seguro de que no existe" vs "Todos los
bits activos → ~99% probabilidad de que existe").

### 5. `ArchDiagram`

Diagrama horizontal: React → Bloom Filter → ¿Probable? → SQL Server. Cada nodo
es una card con icono, label, sublabel y color temático.

## Contratos con el API

### `GET /api/username/stats`

Devuelve snapshot del filtro. **Ampliado respecto a M6** para soportar la
visualización:

```json
{
  "totalItems": 42,
  "filterSizeBits": 9585059,
  "hashFunctions": 7,
  "estimatedFillRatio": 0.0003,
  "estimatedFalsePositiveRate": 0.000001,
  "memorySizeBytes": 1198132,
  "bitsSample": [0, 1, 0, 0, 1, ...]
}
```

`bitsSample` es un array de 256 enteros 0/1: los primeros 256 bits del filtro
(o un submuestreo uniforme si se prefiere representar el filtro completo).
El cliente usa este array para pintar el `BitGridVisualization`.

### `GET /api/username/visualize/{name}`

Nuevo endpoint. Devuelve las posiciones de los hashes para un username, sin
tocar DB ni modificar el filtro:

```json
{
  "username": "pedro",
  "positions": [1234567, 4567890, 7890123, ...]
}
```

Retorna todas las posiciones generadas por los `hashCount` hashes del filtro.
El cliente las usa para alimentar `HashVisualizer` y para resaltar los bits
correspondientes en el `BitGridVisualization` (tras normalizarlas al rango
0-255 con módulo).

## Polling

`StatsPanel` y `BitGridVisualization` hacen `fetch('/api/username/stats')`
cada 1000 ms con `setInterval` dentro de `useEffect`. Cleanup del interval
en el return del effect. No usar WebSockets ni SSE — polling simple.

## Estilo de código React

- Functional components con TypeScript
- Interfaces para props (no `any`)
- Hooks personalizados para la lógica de fetch (ej: `useFilterStats`)
- Estilos inline solo para valores dinámicos (posiciones, colores por prop);
  el resto en `App.css` usando variables CSS declaradas en `:root`
- No añadir dependencias: solo React + fetch nativo
```

Commit:

```bash
git add .github/skills/visual-design/
git commit -m "feat(m07): add visual-design skill based on demo artifact

refs #9"
```

---

## PASO 2 — Ampliar endpoints del backend

### 2.1 Ampliar `BloomFilter<T>` para exponer una muestra de bits y las posiciones

Editar `src/BloomFilter.Api/DataStructures/BloomFilter.cs`. **Añadir** estos dos métodos públicos (no tocar los existentes):

```csharp
/// <summary>
/// Devuelve una muestra de los primeros <paramref name="sampleSize"/> bits del filtro
/// como array de 0/1. Útil para visualización pedagógica en el frontend.
/// </summary>
public int[] GetBitsSample(int sampleSize = 256)
{
    _lock.EnterReadLock();
    try
    {
        int effectiveSize = Math.Min(sampleSize, _size);
        var sample = new int[effectiveSize];
        for (int i = 0; i < effectiveSize; i++)
            sample[i] = _bits[i] ? 1 : 0;
        return sample;
    }
    finally
    {
        _lock.ExitReadLock();
    }
}

/// <summary>
/// Devuelve las posiciones que generaría un ítem si se añadiera, sin modificar
/// el filtro. Útil para visualizar qué bits dispara un username concreto.
/// </summary>
public int[] GetPositionsFor(T item)
{
    return GetPositions(item).ToArray();
}
```

### 2.2 Ampliar `GET /api/username/stats`

Editar `src/BloomFilter.Api/Program.cs`. Reemplazar el handler de `/stats` por:

```csharp
usernameApi.MapGet("/stats", (BloomFilter<string> filter) =>
{
    double fillRatio = 1.0 - Math.Pow(1.0 - 1.0 / filter.Size, (double)filter.HashCount * filter.Count);
    double fpRate = Math.Pow(fillRatio, filter.HashCount);

    return Results.Ok(new
    {
        totalItems = filter.Count,
        filterSizeBits = filter.Size,
        hashFunctions = filter.HashCount,
        estimatedFillRatio = Math.Round(fillRatio, 6),
        estimatedFalsePositiveRate = Math.Round(fpRate, 8),
        memorySizeBytes = filter.Size / 8,
        bitsSample = filter.GetBitsSample(256)
    });
});
```

### 2.3 Añadir `GET /api/username/visualize/{name}`

Justo después del handler de `/stats`, añadir:

```csharp
usernameApi.MapGet("/visualize/{name}", (string name, BloomFilter<string> filter) =>
{
    string normalized = name.Trim().ToLowerInvariant();

    if (normalized.Length < 3 || normalized.Length > 50)
    {
        return Results.BadRequest(new
        {
            type = "https://tools.ietf.org/html/rfc9457",
            title = "Username inválido",
            status = 400,
            detail = "El username debe tener entre 3 y 50 caracteres"
        });
    }

    int[] positions = filter.GetPositionsFor(normalized);
    return Results.Ok(new
    {
        username = normalized,
        positions
    });
});
```

### 2.4 Tests para los nuevos endpoints

Añadir en `tests/BloomFilter.Tests/ApiIntegrationTests.cs`:

```csharp
[Fact]
public async Task Stats_ShouldIncludeBitsSample()
{
    var response = await _client.GetAsync("/api/username/stats");
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    using var doc = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    doc.RootElement.TryGetProperty("bitsSample", out var bitsSample).Should().BeTrue();
    bitsSample.GetArrayLength().Should().Be(256);
}

[Fact]
public async Task Visualize_ValidName_ShouldReturnPositions()
{
    var response = await _client.GetAsync("/api/username/visualize/testuser");
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    using var doc = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    doc.RootElement.TryGetProperty("positions", out var positions).Should().BeTrue();
    positions.GetArrayLength().Should().BeGreaterThan(0);
}

[Fact]
public async Task Visualize_InvalidName_ShouldReturn400()
{
    var response = await _client.GetAsync("/api/username/visualize/ab");
    response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
}
```

### 2.5 Verificar y commit

```bash
dotnet build
dotnet test
git add -A
git commit -m "feat(m07): extend stats endpoint and add visualize endpoint

- BloomFilter.GetBitsSample(size) returns 0/1 array for UI
- BloomFilter.GetPositionsFor(item) exposes hash positions without mutation
- /api/username/stats now includes bitsSample[256]
- /api/username/visualize/{name} new endpoint for pedagogical overlay
- 3 new integration tests

refs #9"
```

---

## PASO 3 — Portar los componentes del demo al frontend real

Todos los archivos nuevos van en `src/bloom-filter-ui/src/components/`. Crear la carpeta si no existe.

### 3.1 Hook compartido `useFilterStats`

Crear `src/bloom-filter-ui/src/hooks/useFilterStats.ts`:

```typescript
import { useEffect, useState } from 'react'

export interface FilterStats {
  totalItems: number
  filterSizeBits: number
  hashFunctions: number
  estimatedFillRatio: number
  estimatedFalsePositiveRate: number
  memorySizeBytes: number
  bitsSample: number[]
}

export function useFilterStats(pollMs = 1000) {
  const [stats, setStats] = useState<FilterStats | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/username/stats')
        if (!res.ok) return
        const data: FilterStats = await res.json()
        if (!cancelled) setStats(data)
      } catch {
        // silent — next tick will retry
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, pollMs)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [pollMs])

  return stats
}
```

### 3.2 Hook `useVisualize`

Crear `src/bloom-filter-ui/src/hooks/useVisualize.ts`:

```typescript
import { useEffect, useState } from 'react'

interface VisualizeResult {
  username: string
  positions: number[]
}

export function useVisualize(username: string, debounceMs = 300) {
  const [result, setResult] = useState<VisualizeResult | null>(null)

  useEffect(() => {
    if (username.length < 3) {
      setResult(null)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/visualize/${encodeURIComponent(username)}`)
        if (res.ok) setResult(await res.json())
      } catch {
        setResult(null)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [username, debounceMs])

  return result
}
```

### 3.3 `BitGridVisualization.tsx`

Crear `src/bloom-filter-ui/src/components/BitGridVisualization.tsx`:

```tsx
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
```

### 3.4 `HashVisualizer.tsx`

Crear `src/bloom-filter-ui/src/components/HashVisualizer.tsx`:

```tsx
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
```

### 3.5 `StatsPanel.tsx`

Crear `src/bloom-filter-ui/src/components/StatsPanel.tsx`:

```tsx
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
```

### 3.6 Reescribir `App.tsx`

Reemplazar `src/bloom-filter-ui/src/App.tsx` completo:

```tsx
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
```

### 3.7 Reescribir `App.css`

Reemplazar `src/bloom-filter-ui/src/App.css`:

```css
:root {
  --bg: #0d0d17;
  --surface: #141422;
  --surface-alt: #0f0f1a;
  --border: #1a1a2e;
  --text: #ccd6f6;
  --text-muted: #8892b0;
  --text-dim: #5a6380;
  --teal: #1abc9c;
  --teal-dark: #16a085;
  --green: #2ecc71;
  --red: #e74c3c;
  --blue: #3498db;
  --orange: #f39c12;
  --yellow: #f1c40f;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  --font-ui: 'Segoe UI', system-ui, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-ui);
  min-height: 100vh;
}

.app {
  max-width: 720px;
  margin: 40px auto;
  padding: 0 20px 60px;
}

header { margin-bottom: 32px; }

h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-dim);
  font-size: 14px;
  font-family: var(--font-mono);
}

h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text);
}

h3 {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-dim);
  margin-bottom: 12px;
}

.check-section, .stats-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 24px;
  margin-bottom: 20px;
}

.section { margin-top: 20px; }

/* --- Input --- */

.input-group { position: relative; margin-bottom: 12px; }

.username-input {
  width: 100%;
  padding: 14px 48px 14px 16px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 16px;
  font-family: var(--font-mono);
  outline: none;
  transition: border-color 0.2s;
}

.username-input:focus { border-color: var(--teal); }

.indicator {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  font-weight: 700;
}

.indicator.loading { color: var(--text-dim); animation: spin 1s linear infinite; }
.indicator.available { color: var(--green); }
.indicator.taken { color: var(--red); }

@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }

/* --- Result --- */

.result {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result.available { background: #0d3320; border: 1px solid #16a08560; }
.result.taken { background: #3d1515; border: 1px solid #e74c3c60; }
.result span { color: var(--text-muted); font-size: 12px; }

/* --- Register button --- */

.register-btn {
  width: 100%;
  padding: 12px;
  background: var(--teal);
  border: none;
  border-radius: 6px;
  color: var(--bg);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 16px;
}

.register-btn:disabled { opacity: 0.4; cursor: default; }
.register-btn:hover:not(:disabled) { opacity: 0.9; }

.register-status {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-family: var(--font-mono);
}

.register-status.success { background: #0d3320; color: var(--green); }
.register-status.error { background: #3d1515; color: var(--red); }

/* --- Bit grid --- */

.bit-grid {
  display: grid;
  padding: 12px;
  background: #0a0a0f;
  border-radius: 8px;
  border: 1px solid var(--border);
  width: fit-content;
}

.bit-cell {
  border-radius: 2px;
  border: 1px solid var(--border);
  transition: all 0.25s ease;
}

/* --- Hash visualizer --- */

.hash-visualizer {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hash-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 13px;
}

.hash-pill .arrow { color: var(--text-dim); }
.hash-pill .position { color: var(--text); font-weight: 600; }
.hash-pill.muted { background: var(--surface-alt); color: var(--text-dim); border: 1px solid var(--border); }

/* --- Stats panel --- */

.stats-panel {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.stat-card {
  padding: 14px;
  background: var(--surface-alt);
  border-radius: 6px;
  border: 1px solid var(--border);
}

.stat-label {
  color: var(--text-dim);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  font-family: var(--font-mono);
  margin-top: 6px;
}
```

### 3.8 Verificar y commit

```bash
cd src/bloom-filter-ui
npm run build
cd ../..
git add -A
git commit -m "feat(m07): port pedagogical components from demo to real frontend

- useFilterStats hook polls /api/username/stats every 1s
- useVisualize hook fetches hash positions for current input (debounced)
- BitGridVisualization renders 256-bit sample with highlight overlay
- HashVisualizer shows which hashes fire for a username
- StatsPanel with 4 live metrics
- App.tsx fully rewritten with sections layout
- App.css adopts demo palette and JetBrains Mono typography

refs #9"
```

---

## PASO 4 — Actualizar el skill `react-frontend` existente

Editar `.github/skills/react-frontend/SKILL.md`. Añadir al final una sección que remite al nuevo skill:

```markdown

## Visualización pedagógica (M7 extension)

Para componentes que visualizan el estado interno del Bloom Filter (bit grid,
hash positions, stats panel), consulta el skill `visual-design`. Ese skill
contiene la paleta, tipografía y contratos con los endpoints
`/api/username/stats` y `/api/username/visualize/{name}`.
```

Commit:

```bash
git add .github/skills/react-frontend/SKILL.md
git commit -m "docs(m07): link react-frontend skill to visual-design

refs #9"
```

---

## PASO 5 — Verificación end-to-end

```bash
# Backend
dotnet build --no-incremental
dotnet test --verbosity normal

# Frontend
cd src/bloom-filter-ui
npm run build
cd ../..

# Checklist
test -f .github/skills/visual-design/SKILL.md && echo "✓ visual-design skill"
test -f src/bloom-filter-ui/src/components/BitGridVisualization.tsx && echo "✓ BitGrid"
test -f src/bloom-filter-ui/src/components/HashVisualizer.tsx && echo "✓ HashVisualizer"
test -f src/bloom-filter-ui/src/components/StatsPanel.tsx && echo "✓ StatsPanel"
test -f src/bloom-filter-ui/src/hooks/useFilterStats.ts && echo "✓ useFilterStats"
test -f src/bloom-filter-ui/src/hooks/useVisualize.ts && echo "✓ useVisualize"
```

Todo debe compilar y los tests deben pasar (4 nuevos tests respecto a M6 —
2 de stats + 3 de visualize, aunque el total depende del estado de M6).

### Verificación manual (Pedro la hace a mano)

1. Arrancar backend: `cd src/BloomFilter.Api && dotnet run`
2. Arrancar frontend: `cd src/bloom-filter-ui && npm run dev`
3. Abrir `http://localhost:5173`
4. Ver que:
   - El StatsPanel muestra 4 métricas y se refresca solo (el número de items sube tras cada register)
   - El BitGrid se actualiza cada segundo
   - Al escribir un username de 3+ chars, aparecen las 3 pills del HashVisualizer
   - Los bits correspondientes se resaltan en amarillo en el BitGrid
   - Register → el StatsPanel sube el contador → bits adicionales se iluminan en teal

---

## PASO 6 — Push y consideración de merge

```bash
git log --oneline module-06/complete..module-07/visual
git push -u origin module-07/visual
```

Tag opcional: `git tag v1.1-visual module-07/visual && git push origin v1.1-visual`

**No mergear a `main` automáticamente.** Pedro decide si el M7 forma parte del
estado "oficial" del repo o se mantiene como rama bonus separada.

Si se mergea, cerrar issue #9 con comentario del commit final.

---

## Resumen del M7

| Elemento | Archivos |
|---|---|
| Nuevo skill | `.github/skills/visual-design/SKILL.md` |
| Backend ampliado | `BloomFilter.cs` (+2 métodos), `Program.cs` (stats extendido + nuevo endpoint) |
| Tests añadidos | 3 en `ApiIntegrationTests.cs` |
| Hooks nuevos | `useFilterStats.ts`, `useVisualize.ts` |
| Componentes nuevos | `BitGridVisualization.tsx`, `HashVisualizer.tsx`, `StatsPanel.tsx` |
| Reescritos | `App.tsx`, `App.css` |
| Skill actualizado | `react-frontend/SKILL.md` (enlace a visual-design) |

**Concepto pedagógico clave del M7**: el alumno aprende a **usar un artefacto
existente como contexto para Copilot**. No le describe el diseño — le pasa el
`demo/bloom-filter-demo.jsx` y deja que el agent extraiga el sistema de diseño
y lo porte a su proyecto real. Es el patrón "feed by example".
