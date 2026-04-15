# Specs del Proyecto — Bloom Filter Username Checker

## Qué vas a construir

Una API REST en .NET 10 que verifica la disponibilidad de usernames en tiempo real,
usando un Bloom Filter como capa de pre-check en memoria. El mismo patrón que usa
Gmail cuando escribes un nombre de usuario y al instante te dice si está libre o no.

El frontend es un formulario React que lanza peticiones mientras el usuario escribe
(con debounce), y el backend responde en microsegundos gracias al filtro en RAM.
La base de datos solo se consulta cuando el Bloom Filter dice "probablemente ocupado" —
y la decisión final siempre la toma el UNIQUE constraint de SQL Server.

---

## Arquitectura

```
┌──────────────┐     GET /check/{name}     ┌──────────────────┐
│   React UI   │ ──────────────────────── → │   .NET 10 API    │
│  (debounce   │                           │                  │
│   300ms)     │ ← ──────────────────────  │  BloomFilter<T>  │
└──────────────┘     { available: true }   │  (Singleton RAM) │
                                           │                  │
                     POST /register        │        │         │
                ──────────────────────── → │        ▼         │
                                           │  ┌────────────┐  │
                ← ──────────────────────   │  │ SQL Server │  │
                     201 / 409             │  │  UNIQUE    │  │
                                           │  └────────────┘  │
                                           └──────────────────┘
```

**Dos capas, dos responsabilidades:**
- Velocidad → Bloom Filter. Consulta O(k) en microsegundos, sin disco.
- Consistencia → DB. UNIQUE constraint + transacción = imposible duplicar.

---

## Estructura del repositorio

```
bloom-filter-dotnet/
├── .github/
│   ├── copilot-instructions.md          ← Capa 1: siempre activa
│   ├── copilot/
│   │   └── mcp.json                     ← Config MCP server GitHub
│   ├── agents/
│   │   ├── planner.agent.md             ← Capa 3: rol planificador
│   │   ├── dotnet-api.agent.md          ← Capa 3: rol implementador
│   │   └── code-reviewer.agent.md       ← Capa 3: rol revisor
│   └── skills/
│       ├── bloom-filter-impl/
│       │   └── SKILL.md                 ← Capa 2: implementación BloomFilter
│       ├── dotnet-testing/
│       │   └── SKILL.md                 ← Capa 2: patrones de testing
│       └── react-frontend/
│           └── SKILL.md                 ← Capa 2: frontend React
├── src/
│   ├── BloomFilter.Api/
│   │   ├── Program.cs
│   │   ├── DataStructures/
│   │   │   └── BloomFilter.cs
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs
│   │   │   └── User.cs
│   │   └── BloomFilter.Api.csproj
│   └── bloom-filter-ui/
│       ├── src/
│       │   ├── App.tsx
│       │   └── hooks/useUsernameCheck.ts
│       ├── package.json
│       └── vite.config.ts
├── tests/
│   └── BloomFilter.Tests/
│       ├── BloomFilterTests.cs
│       ├── ApiIntegrationTests.cs
│       └── BloomFilter.Tests.csproj
└── README.md
```

---

## Dominio

### Entidades

**User** — Un usuario registrado en el sistema.

| Campo | Tipo | Restricciones |
|---|---|---|
| Id | Guid | PK, auto-generado |
| Username | string | UNIQUE, max 50 chars, lowercase, no espacios |
| CreatedAt | DateTimeOffset | Default: UTC now |

### Reglas de negocio

| Código | Regla | Validación |
|---|---|---|
| BR-01 | Un username es único en todo el sistema | UNIQUE constraint en DB |
| BR-02 | Los usernames se normalizan a lowercase antes de cualquier operación | .ToLowerInvariant() |
| BR-03 | El Bloom Filter NUNCA decide solo — es pre-check, no decisor | Si dice "no" → seguro. Si dice "sí" → confirmar con DB |
| BR-04 | Mínimo 3 caracteres, máximo 50, solo alfanuméricos y guiones | Regex: ^[a-z0-9-]{3,50}$ |
| BR-05 | Si dos registros llegan simultáneamente, solo uno gana | El segundo recibe 409 por violación de UNIQUE |

---

## API REST

### GET /api/username/check/{name}

Pre-check rápido contra el Bloom Filter. NO toca la base de datos.

**Request:** `GET /api/username/check/pedro`

**Response 200:**
```json
{
  "username": "pedro",
  "available": false,
  "note": "Probablemente ocupado — confirmar con registro"
}
```

**Lógica:**
1. Normalizar name a lowercase
2. Validar formato (BR-04)
3. Consultar BloomFilter.ProbablyContains(name)
4. Si false → available: true (100% seguro)
5. Si true → available: false (~99% seguro)

### POST /api/username/register

Registro real con confirmación de la base de datos.

**Request:**
```json
{ "username": "nuevousuario" }
```

**Response 201:** Usuario creado.
```json
{
  "id": "a1b2c3...",
  "username": "nuevousuario",
  "createdAt": "2026-04-15T10:30:00Z"
}
```

**Response 409:** Username ya existe.
```json
{
  "type": "https://tools.ietf.org/html/rfc9457",
  "title": "Username no disponible",
  "status": 409,
  "detail": "'nuevousuario' ya está registrado"
}
```

**Lógica:**
1. Normalizar y validar
2. Pre-check con BloomFilter
3. Si probablemente existe → consultar DB para confirmar (puede ser falso positivo)
4. INSERT en DB (protegido por UNIQUE constraint)
5. Si INSERT OK → actualizar BloomFilter.Add(name) → 201
6. Si DbUpdateException → 409 (race condition, otro INSERT ganó)

---

## Bloom Filter — Especificación técnica

### Parámetros de dimensionamiento

| Parámetro | Valor por defecto | Fórmula |
|---|---|---|
| expectedItems | 1,000,000 | Configurable en appsettings.json |
| falsePositiveRate | 0.01 (1%) | Configurable |
| size (bits) | calculado | m = -(n × ln(p)) / (ln(2)²) |
| hashCount | calculado | k = (m/n) × ln(2) |

### Requisitos de implementación

- Thread-safe: `ReaderWriterLockSlim` (lecturas concurrentes, escrituras exclusivas)
- Precarga al arrancar desde DB (no lazy)
- Singleton en el contenedor de DI
- Hash function: FNV-1a con double hashing (Kirsch-Mitzenmacker)
- Sin soporte para borrado (Bloom Filter clásico)

---

## Stack técnico

| Componente | Tecnología |
|---|---|
| Backend | .NET 10, C# 13, Minimal API |
| Base de datos | SQL Server (EF Core 10) |
| Frontend | React 19, TypeScript, Vite |
| Tests | xUnit, FluentAssertions, WebApplicationFactory |
| IDE | VS Code + GitHub Copilot |
| AI tooling | Skills, Agents, GitHub MCP Server |

---

## Convenciones de código

### Backend (.NET)
- Minimal API (no Controllers)
- TypedResults en endpoints
- record para DTOs y respuestas
- ProblemDetails para errores (RFC 9457)
- PascalCase público, _camelCase privado
- Async everywhere excepto BloomFilter (sync por diseño)

### Frontend (React)
- Functional components con hooks
- Custom hooks para lógica de negocio (useUsernameCheck)
- Debounce de 300ms en el input
- Proxy en desarrollo: Vite → localhost:5000

### Tests
- Patrón AAA (Arrange-Act-Assert)
- Naming: Method_Scenario_ExpectedResult
- Tests de concurrencia obligatorios para BloomFilter
- WebApplicationFactory para integración

---

## Requisitos previos del alumno

- .NET 10 SDK instalado
- Node.js 22+ (para el frontend React)
- VS Code con extensión GitHub Copilot
- Cuenta GitHub con Copilot activo
- SQL Server (LocalDB o Docker)
- Git configurado
