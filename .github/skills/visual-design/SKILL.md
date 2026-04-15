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
- `positions: number[]` — posiciones (una por hash)

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

`bitsSample` es un array de 256 enteros 0/1: los primeros 256 bits del filtro.
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
