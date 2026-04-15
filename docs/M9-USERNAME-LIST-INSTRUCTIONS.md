# INSTRUCCIONES PARA CLAUDE CODE — Módulo 9: Panel de usernames (Bonus)

## Contexto

Este documento contiene las instrucciones para generar el **Módulo 9 (bonus)**
del curso "GitHub Copilot: Skills, Agents y MCP". Parte del estado del repo
al final del M8: proyecto con visualización pedagógica (M7) y documentación
interactiva Scalar (M8), pero sin forma visual de ver los usernames ya
registrados.

**Objetivo pedagógico**: enseñar cómo añadir una **feature nueva full-stack**
con Copilot — endpoint de query nuevo + componente React nuevo que lo
consume + integración con los hooks existentes. Patrón diferente al M8
(middleware/config) y al M7 (restyling de UI).

La referencia visual del feature es el bloque "Usernames precargados (prueba
con estos)" del `demo/bloom-filter-demo.jsx:699-724`, que renderizaba unas
pills clicables. La diferencia: en el demo la lista era hardcoded; aquí
viene de la DB real.

Los bonus del curso quedan:
- **M7**: iterar sobre UI existente con un artefacto visual de referencia
- **M8**: feature cross-cutting de backend (paquete + middleware)
- **M9**: feature nueva full-stack (endpoint + componente UI + integración)

Capítulo opcional de ~10 min grabables.

---

## Precondiciones

- Rama activa: `module-08/scalar` (o posterior).
- `dotnet build` limpio, `dotnet test` verde (21 tests), `npm run build` OK.
- El skill `visual-design` existe (del M7).
- El endpoint `/stats` devuelve `bitsSample[256]` (del M7).
- El endpoint Scalar está activo en Development (del M8) — el nuevo endpoint
  `/list` quedará automáticamente documentado en Scalar al añadir `.WithTags()`.

Si alguna condición no se cumple, **PARAR** y avisar.

---

## Estrategia de rama y commits

```
module-08/scalar
  └── module-09/username-list    ← Bonus: panel de pills
       └── (merge a main)
```

4 commits en total, todos con `refs #11`.

---

## PASO 0 — Crear la rama

```bash
git checkout module-08/scalar
git pull
git checkout -b module-09/username-list
```

---

## PASO 1 — Backend: endpoint `GET /api/username/list`

### 1.1 Nuevo DTO en `Contracts.cs`

Editar `src/BloomFilter.Api/Contracts.cs`. Añadir al final:

```csharp
public record UsernameListItem(
    string Username,
    DateTimeOffset CreatedAt
);
```

### 1.2 Endpoint en `Program.cs`

Añadir al grupo `usernameApi` (después del handler `/register`, antes de
`/stats` — o donde encaje temáticamente):

```csharp
// Lista de usernames registrados (para panel de verificación visual en la UI)
usernameApi.MapGet("/list", async (AppDbContext db) =>
{
    var users = await db.Users
        .OrderBy(u => u.CreatedAt)
        .Take(200)
        .Select(u => new UsernameListItem(u.Username, u.CreatedAt))
        .ToListAsync();

    return Results.Ok(users);
})
.WithTags("Username")
.WithName("ListUsernames")
.Produces<List<UsernameListItem>>(StatusCodes.Status200OK);
```

- `.OrderBy(CreatedAt)` — orden cronológico (el seed aparece primero, los
  registros nuevos al final).
- `.Take(200)` — techo de seguridad. El filtro soporta 1M pero el UI no
  necesita más pills. Si se quiere paginación, parámetro `?limit=N&offset=M`
  (fuera de scope del M9).
- Proyección a `UsernameListItem` — evita devolver `Id` (Guid sin valor
  visual) y mantiene consistencia con las convenciones del proyecto (records).

### 1.3 Test de integración

Añadir al final de `tests/BloomFilter.Tests/ApiIntegrationTests.cs`
(antes del cierre de la clase):

```csharp
[Fact]
public async Task ListUsernames_ShouldIncludeSeededEntries()
{
    var response = await _client.GetAsync("/api/username/list");

    response.StatusCode.Should().Be(HttpStatusCode.OK);
    var items = await response.Content.ReadFromJsonAsync<List<UsernameListItem>>();

    items.Should().NotBeNull();
    items!.Should().NotBeEmpty();
    // El seed del Program.cs registra 40 usernames al arrancar; pueden haber
    // añadido más durante otros tests, pero los del seed siempre están.
    items.Select(i => i.Username).Should().Contain("pedro");
    items.Select(i => i.Username).Should().Contain("admin");
}
```

### 1.4 Verificar y commit

```bash
dotnet build
dotnet test
```

Esperado: **22/22 verdes**.

```bash
git add -A
git commit -m "feat(m09): add GET /api/username/list endpoint

- UsernameListItem record in Contracts.cs
- GET /api/username/list returns up to 200 users ordered by CreatedAt
- .WithTags(\"Username\").WithName(\"ListUsernames\") for Scalar
- Integration test verifies seeded entries are present

refs #11"
```

---

## PASO 2 — Frontend: hook + componente + integración

### 2.1 Hook `useUsernameList`

Crear `src/bloom-filter-ui/src/hooks/useUsernameList.ts`:

```typescript
import { useEffect, useState } from 'react'

export interface UsernameListItem {
  username: string
  createdAt: string
}

export function useUsernameList(pollMs = 2000) {
  const [items, setItems] = useState<UsernameListItem[]>([])

  useEffect(() => {
    let cancelled = false

    const fetchList = async () => {
      try {
        const res = await fetch('/api/username/list')
        if (!res.ok) return
        const data: UsernameListItem[] = await res.json()
        if (!cancelled) setItems(data)
      } catch {
        // silent — next tick will retry
      }
    }

    fetchList()
    const interval = setInterval(fetchList, pollMs)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [pollMs])

  return items
}
```

Polling cada 2 s (el usuario registra uno nuevo → aparece en menos de 2 s
en el panel). Misma mecánica que `useFilterStats` del M7.

### 2.2 Componente `UsernameListPanel`

Crear `src/bloom-filter-ui/src/components/UsernameListPanel.tsx`:

```tsx
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
```

- **Al clicar** → llama a `onPick(username)` que el `App.tsx` conecta a
  `setUsername` del hook `useUsernameCheck`. Esto dispara automáticamente
  el check y el visualize → los bits se iluminan en el `BitGridVisualization`.
- **Title tooltip** con la fecha de registro.
- **Sin estado propio** — es puramente presentacional.

### 2.3 Integración en `App.tsx`

Editar `src/bloom-filter-ui/src/App.tsx`. Añadir imports:

```tsx
import { useUsernameList } from './hooks/useUsernameList'
import { UsernameListPanel } from './components/UsernameListPanel'
```

Dentro del componente, usar el hook:

```tsx
const users = useUsernameList(2000)
```

Dentro del `<section className="stats-section">`, **después del
`BitGridVisualization`**, añadir:

```tsx
<div className="section">
  <h3>Usernames registrados</h3>
  <UsernameListPanel items={users} onPick={setUsername} />
</div>
```

`setUsername` ya lo devuelve `useUsernameCheck`, así que solo hay que
pasarlo como prop.

### 2.4 Estilos en `App.css`

Añadir al final del archivo:

```css
/* --- Username list panel --- */

.list-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.list-count {
  color: var(--teal);
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
}

.list-label {
  color: var(--text-dim);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.username-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
  padding: 4px;
}

.username-pill {
  padding: 5px 12px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all 0.15s ease;
}

.username-pill:hover {
  border-color: var(--teal);
  color: var(--teal);
  background: #16a08515;
}

.username-pill:active {
  transform: scale(0.96);
}
```

### 2.5 Verificar

```bash
cd src/bloom-filter-ui
npm run build
cd ../..
```

Debe compilar sin errores.

### 2.6 Commit

```bash
git add -A
git commit -m "feat(m09): username list panel with clickable pills

- useUsernameList hook polls /api/username/list every 2s
- UsernameListPanel renders clickable pills, onPick wires to setUsername
- Clicking a pill triggers check + visualize automatically, highlighting
  the corresponding hash bits in BitGridVisualization
- CSS adds list-header, username-pills layout with hover teal
- Integrated in App.tsx inside stats-section, after the BitGridVisualization

refs #11"
```

---

## PASO 3 — Actualizar el skill `visual-design`

Editar `.github/skills/visual-design/SKILL.md`. En la sección "Componentes
pedagógicos a portar", añadir un nuevo punto:

```markdown
### 6. `UsernameListPanel`

Lista de pills clicables con todos los usernames registrados (consumiendo
`GET /api/username/list`). Al clicar una pill, setea el username en el
input del `useUsernameCheck`, lo que dispara automáticamente check +
visualize + iluminación de bits en el `BitGridVisualization`.

Props:
- `items: { username, createdAt }[]` — desde `useUsernameList()` (polling 2s)
- `onPick: (username: string) => void` — el `setUsername` del `useUsernameCheck`

Layout: header con contador teal grande + label uppercase. Debajo, grid
flex de pills de 12px, `font-mono`, fondo `--surface-alt`, hover teal con
scale(0.96) en active. Max-height 240px con scroll vertical.
```

Y en la sección "Contratos con el API", añadir:

```markdown
### `GET /api/username/list`

Devuelve los usernames registrados, ordenados cronológicamente, máximo 200.
Usado por el panel de pills de la UI para verificación visual.

```json
[
  { "username": "pedro", "createdAt": "2026-04-15T08:30:00Z" },
  { "username": "admin", "createdAt": "2026-04-15T08:30:00Z" },
  ...
]
```
```

Commit:

```bash
git add .github/skills/visual-design/SKILL.md
git commit -m "docs(m09): document UsernameListPanel and /list endpoint in visual-design skill

refs #11"
```

---

## PASO 4 — Verificación end-to-end

```bash
dotnet build --no-incremental
dotnet test --verbosity normal
cd src/bloom-filter-ui && npm run build && cd ../..
```

Esperado: **22/22 tests verdes**, frontend build OK.

### Verificación manual (Pedro, con DevLauncher)

1. Arrancar backend + frontend.
2. Abrir `http://localhost:5173`.
3. Al cargar, debajo del bit grid aparece "40 usernames registrados — clica
   para comprobar" con las pills de pedro, maria, carlos, ... (los del seed
   en orden cronológico de inserción).
4. Clicar "pedro" → el input se rellena automáticamente → el check marca
   "✗ No disponible" → el HashVisualizer muestra los 3 hashes → los bits
   correspondientes se iluminan en amarillo en el BitGrid.
5. Escribir un username nuevo → registrar → en menos de 2 s la pill aparece
   al final del panel (polling).
6. Abrir `http://localhost:5000/scalar/v1` — el endpoint `ListUsernames`
   aparece bajo el grupo "Username".

---

## PASO 5 — Push, tag y merge

```bash
git log --oneline module-08/scalar..module-09/username-list
git push -u origin module-09/username-list

# Tag
git tag v1.3-username-list module-09/username-list
git push origin v1.3-username-list

# Merge a main
git checkout main
git merge module-09/username-list --no-ff -m "merge: M9 bonus username list panel into main

Closes #11."
git push origin main
```

Cerrar issue #11 vía MCP con el commit del merge.

---

## Resumen del M9

| Elemento | Archivos |
|---|---|
| Backend | `Contracts.cs` (+`UsernameListItem` record), `Program.cs` (+endpoint `/list`) |
| Tests añadidos | 1 en `ApiIntegrationTests.cs` (22 totales) |
| Frontend hooks | `useUsernameList.ts` (nuevo) |
| Frontend components | `UsernameListPanel.tsx` (nuevo) |
| Frontend integration | `App.tsx` (añade hook + sección), `App.css` (estilos pills) |
| Skill actualizado | `.github/skills/visual-design/SKILL.md` (añade componente + contrato) |

**Concepto pedagógico clave**: añadir una feature nueva full-stack siguiendo
los skills existentes. El alumno ve cómo Copilot puede extender tanto backend
(respetando las convenciones de `bloom-filter-impl` y `api-documentation`)
como frontend (respetando `visual-design`), y cómo integrarla con hooks
preexistentes (`useUsernameCheck.setUsername`) sin re-inventar nada.
