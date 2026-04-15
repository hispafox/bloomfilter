# INSTRUCCIONES PARA CLAUDE CODE — Proyecto Bloom Filter Copilot Course

## Contexto

Este documento contiene TODAS las instrucciones para generar el repositorio completo del curso "GitHub Copilot: Skills, Agents y MCP". Claude Code debe crear el proyecto desde cero, con una rama por cada módulo del curso, implementando código funcional, tests, skills, agents y configuración MCP.

**El proyecto es un API REST en .NET 10 + React que verifica disponibilidad de usernames usando un Bloom Filter en memoria.** Es el proyecto práctico de un curso de 2 horas sobre GitHub Copilot.

---

## Estrategia de ramas

Cada rama representa el estado del proyecto al FINAL de un módulo del curso. Las ramas son acumulativas — cada una incluye todo lo de las anteriores más lo nuevo del módulo.

```
starter              ← Esqueleto vacío (el alumno clona esto)
  └── module-01/setup         ← Proyecto .NET + React base, compila pero sin lógica
      └── module-02/instructions  ← Añade copilot-instructions.md
          └── module-03/skills        ← Añade los 3 skills
              └── module-04/agents        ← Añade los 3 agents
                  └── module-05/mcp           ← Añade mcp.json
                      └── module-06/complete      ← Todo implementado: BloomFilter, endpoints, tests, frontend
main ← Merge final de module-06/complete
```

---

## PASO 0 — Inicializar el repositorio

```bash
mkdir bloom-filter-dotnet
cd bloom-filter-dotnet
git init
```

Crear `.gitignore`:

```gitignore
# .NET
bin/
obj/
*.user
*.suo
*.DotSettings
appsettings.Development.json

# Node
node_modules/
dist/

# IDE
.vs/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db
```

Crear `README.md`:

```markdown
# Bloom Filter Username Checker

Proyecto práctico del curso **GitHub Copilot: Skills, Agents y MCP**.

Un API REST en .NET 10 + React que verifica la disponibilidad de usernames
al instante, usando un Bloom Filter como pre-check en memoria. El mismo
patrón que usa Gmail.

## Quick Start

```bash
# Backend
cd src/BloomFilter.Api
dotnet restore
dotnet run

# Frontend (otra terminal)
cd src/bloom-filter-ui
npm install
npm run dev
```

## Estructura del proyecto

```
.github/
├── copilot-instructions.md      # Convenciones del proyecto
├── copilot/mcp.json             # GitHub MCP Server config
├── agents/                      # Custom Agents (Planner, Builder, Reviewer)
└── skills/                      # Agent Skills (Bloom Filter, Testing, React)
src/
├── BloomFilter.Api/             # Backend .NET 10
└── bloom-filter-ui/             # Frontend React + TypeScript
tests/
└── BloomFilter.Tests/           # Tests xUnit
```

## Ramas

Cada rama corresponde a un módulo del curso:

| Rama | Módulo | Qué añade |
|---|---|---|
| `starter` | — | Esqueleto vacío |
| `module-01/setup` | M1 | Proyecto base |
| `module-02/instructions` | M2 | Custom Instructions |
| `module-03/skills` | M3 | Agent Skills |
| `module-04/agents` | M4 | Custom Agents |
| `module-05/mcp` | M5 | GitHub MCP |
| `module-06/complete` | M6 | Implementación completa |
| `main` | — | Estado final |
```

Commit inicial:

```bash
git add .
git commit -m "chore: initial commit with .gitignore and README"
```

---

## PASO 1 — Rama `starter` (esqueleto vacío)

```bash
git checkout -b starter
```

### 1.1 Crear la solución .NET

```bash
dotnet new sln -n BloomFilter
mkdir -p src/BloomFilter.Api
cd src/BloomFilter.Api
dotnet new webapi -n BloomFilter.Api --use-minimal-apis --no-https
cd ../..
dotnet sln add src/BloomFilter.Api/BloomFilter.Api.csproj

mkdir -p tests/BloomFilter.Tests
cd tests/BloomFilter.Tests
dotnet new xunit -n BloomFilter.Tests
dotnet add package FluentAssertions
dotnet add reference ../../src/BloomFilter.Api/BloomFilter.Api.csproj
cd ../..
dotnet sln add tests/BloomFilter.Tests/BloomFilter.Tests.csproj
```

### 1.2 Limpiar el proyecto generado

En `src/BloomFilter.Api/Program.cs`, reemplazar TODO el contenido por:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Services will be added here

var app = builder.Build();

app.MapGet("/", () => "Bloom Filter API is running");

app.Run();
```

Eliminar archivos generados innecesarios:
- Borrar `src/BloomFilter.Api/WeatherForecast.cs` si existe
- Borrar cualquier controller generado

### 1.3 Crear el frontend React

```bash
cd src
npm create vite@latest bloom-filter-ui -- --template react-ts
cd bloom-filter-ui
npm install
cd ../..
```

En `src/bloom-filter-ui/vite.config.ts`, configurar el proxy:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
```

### 1.4 Crear estructura de carpetas vacía

```bash
mkdir -p .github/agents
mkdir -p .github/skills
mkdir -p .github/copilot
mkdir -p src/BloomFilter.Api/DataStructures
mkdir -p src/BloomFilter.Api/Data
```

### 1.5 Verificar

```bash
dotnet build
dotnet test
cd src/bloom-filter-ui && npm run build && cd ../..
```

Todo debe compilar sin errores.

```bash
git add .
git commit -m "chore: scaffold empty project (starter branch)"
```

---

## PASO 2 — Rama `module-01/setup` (proyecto base)

```bash
git checkout -b module-01/setup
```

### 2.1 Entidad User

Crear `src/BloomFilter.Api/Data/User.cs`:

```csharp
namespace BloomFilter.Api.Data;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Username { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
```

### 2.2 DbContext

Crear `src/BloomFilter.Api/Data/AppDbContext.cs`:

```csharp
using Microsoft.EntityFrameworkCore;

namespace BloomFilter.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.Property(e => e.Username).HasMaxLength(50);
        });
    }
}
```

### 2.3 Añadir paquetes NuGet

```bash
cd src/BloomFilter.Api
dotnet add package Microsoft.EntityFrameworkCore.InMemory
dotnet add package Microsoft.AspNetCore.OpenApi
cd ../..
```

### 2.4 Actualizar Program.cs con DB

Reemplazar `src/BloomFilter.Api/Program.cs`:

```csharp
using BloomFilter.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseInMemoryDatabase("BloomFilterDb"));

var app = builder.Build();

app.MapGet("/", () => "Bloom Filter API is running");

// Endpoints will be added here

app.Run();
```

### 2.5 Añadir un test básico de smoke

Reemplazar `tests/BloomFilter.Tests/UnitTest1.cs` por `tests/BloomFilter.Tests/SmokeTests.cs`:

```csharp
using FluentAssertions;

namespace BloomFilter.Tests;

public class SmokeTests
{
    [Fact]
    public void Project_ShouldCompile()
    {
        true.Should().BeTrue();
    }
}
```

### 2.6 Verificar y commit

```bash
dotnet build
dotnet test
git add .
git commit -m "feat(m01): base project with User entity and InMemory DB"
```

---

## PASO 3 — Rama `module-02/instructions` (Custom Instructions)

```bash
git checkout -b module-02/instructions
```

### 3.1 Crear copilot-instructions.md

Crear `.github/copilot-instructions.md`:

```markdown
# Convenciones del proyecto Bloom Filter

## Stack técnico
- Backend: .NET 10, C# 13, Minimal API (NO Controllers)
- Frontend: React 19 + TypeScript + Vite
- Base de datos: InMemory para desarrollo, SQL Server para producción
- Tests: xUnit + FluentAssertions

## Arquitectura
- El BloomFilter<T> es un Singleton thread-safe registrado en DI
- Se precarga con todos los usernames existentes al arrancar la app
- Los endpoints NO tocan la DB si el Bloom Filter dice "no existe"
- La consistencia la garantiza el UNIQUE constraint, no el filtro

## Estilo de código
- Usa `record` para DTOs y respuestas de API
- Usa `TypedResults` en endpoints (no Results.Ok genérico)
- Usa ProblemDetails (RFC 9457) para errores
- Naming: PascalCase público, _camelCase privado con prefijo underscore
- Async everywhere excepto en el BloomFilter (sync por diseño)
- NO uses Controllers — solo Minimal API
- NO crees interfaces innecesarias (no IBloomFilter)
- NO uses `var` cuando el tipo no sea obvio en la misma línea

## Tests
- Patrón AAA (Arrange-Act-Assert)
- Naming: Method_Scenario_ExpectedResult
- Tests de concurrencia obligatorios para el BloomFilter
- WebApplicationFactory para tests de integración
```

### 3.2 Commit

```bash
git add .
git commit -m "feat(m02): add copilot-instructions.md with project conventions"
```

---

## PASO 4 — Rama `module-03/skills` (Agent Skills)

```bash
git checkout -b module-03/skills
```

### 4.1 Skill: bloom-filter-impl

Crear `.github/skills/bloom-filter-impl/SKILL.md`:

```markdown
---
name: bloom-filter-impl
description: >
  Implementación de referencia del Bloom Filter en .NET 10. Usa este skill
  cuando necesites crear, modificar o dimensionar un Bloom Filter. Incluye
  la clase BloomFilter<T>, fórmulas de dimensionamiento, integración con
  Minimal API y el patrón de dos capas (filtro + DB constraint).
---

# Bloom Filter — Implementación .NET 10

## Clase de referencia

La implementación usa BitArray con ReaderWriterLockSlim para thread-safety.
Lecturas concurrentes (ProbablyContains), escrituras exclusivas (Add).

```csharp
using System.Collections;

namespace BloomFilter.Api.DataStructures;

public sealed class BloomFilter<T> where T : notnull
{
    private readonly BitArray _bits;
    private readonly int _hashCount;
    private readonly int _size;
    private readonly ReaderWriterLockSlim _lock = new();
    private int _count;

    public int Count => _count;
    public int Size => _size;
    public int HashCount => _hashCount;

    public BloomFilter(int expectedItems, double falsePositiveRate = 0.01)
    {
        _size = OptimalSize(expectedItems, falsePositiveRate);
        _hashCount = OptimalHashCount(_size, expectedItems);
        _bits = new BitArray(_size);
    }

    public void Add(T item)
    {
        _lock.EnterWriteLock();
        try
        {
            foreach (var pos in GetPositions(item))
                _bits[pos] = true;
            Interlocked.Increment(ref _count);
        }
        finally { _lock.ExitWriteLock(); }
    }

    public bool ProbablyContains(T item)
    {
        _lock.EnterReadLock();
        try
        {
            return GetPositions(item).All(pos => _bits[pos]);
        }
        finally { _lock.ExitReadLock(); }
    }

    private IEnumerable<int> GetPositions(T item)
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(item.ToString()!);
        var hash1 = ComputeHash(bytes, seed: 0);
        var hash2 = ComputeHash(bytes, seed: 7919);

        for (int i = 0; i < _hashCount; i++)
        {
            var combinedHash = Math.Abs((hash1 + i * hash2) % _size);
            yield return combinedHash;
        }
    }

    private static int ComputeHash(byte[] data, int seed)
    {
        unchecked
        {
            var hash = (uint)(seed ^ 2166136261);
            foreach (var b in data)
            {
                hash ^= b;
                hash *= 16777619;
            }
            return (int)(hash & 0x7FFFFFFF);
        }
    }

    public static int OptimalSize(int n, double p)
        => (int)Math.Ceiling(-n * Math.Log(p) / (Math.Log(2) * Math.Log(2)));

    public static int OptimalHashCount(int m, int n)
        => (int)Math.Round((double)m / n * Math.Log(2));
}
```

## Fórmulas de dimensionamiento

- Tamaño óptimo: `m = -(n * ln(p)) / (ln(2)²)`
- Hash count óptimo: `k = (m/n) * ln(2)`
- Para 1M items con 1% FP: ~9.6M bits (~1.2 MB), k=7

## Registro en DI

Registrar como Singleton. Precargar desde DB al arrancar.

```csharp
builder.Services.AddSingleton(sp =>
{
    var filter = new BloomFilter<string>(
        expectedItems: 1_000_000,
        falsePositiveRate: 0.01);

    using var scope = sp.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    foreach (var username in db.Users.Select(u => u.Username))
        filter.Add(username.ToLowerInvariant());

    return filter;
});
```

## Patrón de dos capas

- Velocidad → Bloom Filter (RAM, O(k), microsegundos)
- Consistencia → DB + UNIQUE constraint (disco, transaccional)
- El Bloom Filter NUNCA decide solo. Si dice "no" → seguro. Si dice "sí" → confirmar con DB.

## Endpoints de referencia

### GET /api/username/check/{name}
Pre-check rápido. Solo Bloom Filter. No toca DB.
Devuelve TypedResults.Ok con record UsernameCheckResult.

### POST /api/username/register
Registro real. Pre-check con filtro, INSERT en DB, catch DbUpdateException
para race conditions. Actualizar filtro después de INSERT exitoso.
```

### 4.2 Skill: dotnet-testing

Crear `.github/skills/dotnet-testing/SKILL.md`:

```markdown
---
name: dotnet-testing
description: >
  Genera tests para el proyecto Bloom Filter. Usa este skill cuando
  necesites escribir tests unitarios, de integración o de concurrencia.
  Incluye patrones para testear estructuras probabilísticas donde
  los resultados no son deterministas.
---

# Testing del Bloom Filter

## Tests unitarios del BloomFilter<T>

### Test básico: Add + ProbablyContains
```csharp
[Fact]
public void Add_ThenProbablyContains_ShouldReturnTrue()
{
    var filter = new BloomFilter<string>(1000, 0.01);
    filter.Add("testuser");
    filter.ProbablyContains("testuser").Should().BeTrue();
}
```

### Test de no existencia (cero falsos negativos)
```csharp
[Fact]
public void ProbablyContains_NonExistent_ShouldReturnFalse()
{
    var filter = new BloomFilter<string>(1000, 0.01);
    filter.ProbablyContains("nonexistent").Should().BeFalse();
}
```

### Test de tasa de falsos positivos (estadístico)
```csharp
[Fact]
public void FalsePositiveRate_ShouldBeWithinBounds()
{
    var filter = new BloomFilter<string>(10_000, 0.01);
    for (int i = 0; i < 10_000; i++)
        filter.Add($"user_{i}");

    var falsePositives = Enumerable.Range(10_000, 10_000)
        .Count(i => filter.ProbablyContains($"user_{i}"));

    var rate = (double)falsePositives / 10_000;
    rate.Should().BeLessThan(0.02, "FP rate should be ~1% with margin");
}
```

### Test de concurrencia
```csharp
[Fact]
public void ConcurrentAccess_ShouldNotThrow()
{
    var filter = new BloomFilter<string>(100_000, 0.01);

    var act = () => Parallel.For(0, 10_000, i =>
    {
        filter.Add($"user_{i}");
        filter.ProbablyContains($"user_{i}");
    });

    act.Should().NotThrow();
}
```

## Tests de integración del API

Usa WebApplicationFactory<Program>. Flujo completo:
1. GET /api/username/check/nuevo → available: true
2. POST /api/username/register { "username": "nuevo" } → 201
3. GET /api/username/check/nuevo → available: false
4. POST /api/username/register { "username": "nuevo" } → 409
```

### 4.3 Skill: react-frontend

Crear `.github/skills/react-frontend/SKILL.md`:

```markdown
---
name: react-frontend
description: >
  Genera el frontend React para el checker de usernames. Usa este skill
  cuando necesites crear componentes del UI, conectar con la API .NET,
  o implementar el feedback visual en tiempo real (debounce, estados
  de carga, indicadores de disponibilidad).
---

# Frontend React — Username Checker

## Stack
- React 19 + TypeScript
- Vite como bundler
- CSS modules o inline styles (no Tailwind en este proyecto)
- fetch nativo (no axios)

## Hook principal

```typescript
import { useState, useEffect } from 'react';

interface CheckResult {
  username: string;
  available: boolean;
  note: string;
}

export function useUsernameCheck(debounceMs = 300) {
  const [username, setUsername] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username.length < 3) {
      setResult(null);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/check/${encodeURIComponent(username)}`);
        if (res.ok) {
          setResult(await res.json());
          setError(null);
        }
      } catch {
        setError('Error checking username');
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [username, debounceMs]);

  return { username, setUsername, result, loading, error };
}
```

## Componente principal

Input con debounce de 300ms. Indicador visual:
- Spinner mientras carga
- ✓ verde si available: true
- ✗ rojo si available: false
- Mínimo 3 caracteres para activar la búsqueda

## Registro

Botón de Register que hace POST /api/username/register.
Manejar 201 (éxito), 409 (duplicado) y errores de red.
```

### 4.4 Commit

```bash
git add .
git commit -m "feat(m03): add agent skills (bloom-filter-impl, dotnet-testing, react-frontend)"
```

---

## PASO 5 — Rama `module-04/agents` (Custom Agents)

```bash
git checkout -b module-04/agents
```

### 5.1 Agent: Planner

Crear `.github/agents/planner.agent.md`:

```markdown
---
name: Planner
description: >
  Genera planes de implementación para features del proyecto Bloom Filter.
  Analiza el codebase existente, propone la estructura de archivos y clases,
  y crea issues en GitHub con el plan detallado.
tools:
  - search/codebase
  - search/usages
  - web/fetch
  - github/create_issue
  - github/list_issues
handoffs:
  - label: Implementar en .NET
    agent: dotnet-api
    prompt: >
      Implementa el plan descrito arriba siguiendo las convenciones
      del proyecto y los skills de bloom-filter-impl.
    send: false
  - label: Crear issue en GitHub
    agent: agent
    prompt: >
      Crea un issue en GitHub con el plan de implementación anterior,
      incluyendo los acceptance criteria y las tareas desglosadas.
    send: true
---

# Instrucciones del Planner

Eres un arquitecto de software especializado en .NET 10 y estructuras de datos
probabilísticas. Tu trabajo es generar planes de implementación, NO código.

## Proceso

1. Analiza el codebase con las herramientas de búsqueda.
2. Investiga si necesario con web/fetch para validar decisiones técnicas.
3. Genera el plan en Markdown con:
   - Overview: qué se va a construir y por qué
   - Archivos a crear/modificar (con rutas exactas)
   - Dependencias NuGet necesarias
   - Decisiones de diseño y trade-offs
   - Acceptance criteria (verificables)
   - Estimación de complejidad (S/M/L)

## Convenciones

- Backend: .NET 10 Minimal API, Clean Architecture light
- Frontend: React + TypeScript + Vite
- Tests: xUnit + FluentAssertions
- El BloomFilter es un Singleton registrado en DI
- Los endpoints siguen /api/{recurso}/{accion}
```

### 5.2 Agent: .NET API Builder

Crear `.github/agents/dotnet-api.agent.md`:

```markdown
---
name: .NET API Builder
description: >
  Implementa features del backend .NET 10 para el proyecto Bloom Filter.
  Genera código siguiendo Clean Architecture, registra servicios en DI,
  crea endpoints Minimal API y escribe tests.
tools:
  - read
  - edit
  - search/codebase
  - terminal
  - github/create_issue
  - github/list_issues
handoffs:
  - label: Revisar código
    agent: code-reviewer
    prompt: >
      Revisa el código implementado arriba. Verifica que sigue las
      convenciones del proyecto, que los tests cubren los casos edge,
      y que el BloomFilter mantiene thread-safety.
    send: false
---

# Instrucciones del .NET API Builder

Eres un desarrollador senior .NET especializado en APIs de alto rendimiento
y estructuras de datos probabilísticas.

## Stack

- .NET 10, C# 13, Minimal API
- InMemory DB para desarrollo (EF Core)
- BloomFilter<T> como Singleton en DI (thread-safe)
- xUnit + FluentAssertions para tests

## Reglas

1. BloomFilter siempre thread-safe con ReaderWriterLockSlim.
2. Endpoints con Minimal API y TypedResults.
3. Respuestas con record types inmutables.
4. Mínimo un test por endpoint + un test de concurrencia.
5. Ejecuta `dotnet build` y `dotnet test` antes de terminar.
6. Consulta el skill bloom-filter-impl para la implementación de referencia.
```

### 5.3 Agent: Code Reviewer

Crear `.github/agents/code-reviewer.agent.md`:

```markdown
---
name: Code Reviewer
description: >
  Revisa código del proyecto Bloom Filter contra las convenciones del equipo.
  Verifica thread-safety, cobertura de tests, patrones de API y rendimiento.
  No modifica código — solo genera feedback estructurado.
tools:
  - read
  - search/codebase
  - search/usages
---

# Instrucciones del Code Reviewer

Eres un revisor de código senior. Tu trabajo es encontrar problemas,
NO modificar archivos. Genera un informe de revisión.

## Checklist

### Thread-safety (crítico)
- [ ] BitArray protegido con locks
- [ ] Lecturas concurrentes con ReaderWriterLockSlim
- [ ] Add() con write lock
- [ ] Sin race conditions en check + register

### API Design
- [ ] Endpoints devuelven TypedResults
- [ ] Record types inmutables para respuestas
- [ ] ProblemDetails para errores (RFC 9457)

### Tests
- [ ] Tests de concurrencia (Parallel.For)
- [ ] Test de tasa de falsos positivos
- [ ] Flujo completo check → register → re-check

### Rendimiento
- [ ] BloomFilter precargado al arrancar
- [ ] Endpoint check NO toca DB

## Formato

```markdown
## Revisión de [archivo/feature]

### Problemas
1. **[CRITICAL/WARNING/INFO]** Descripción → Sugerencia

### Aprobado
- Lo bien implementado

### Veredicto: APROBADO / CAMBIOS NECESARIOS
```
```

### 5.4 Commit

```bash
git add .
git commit -m "feat(m04): add custom agents (planner, dotnet-api, code-reviewer)"
```

---

## PASO 6 — Rama `module-05/mcp` (GitHub MCP)

```bash
git checkout -b module-05/mcp
```

### 6.1 Configuración MCP

Crear `.github/copilot/mcp.json`:

```json
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "X-MCP-Toolsets": "issues,pull_requests,repos,context"
      }
    }
  }
}
```

### 6.2 Commit

```bash
git add .
git commit -m "feat(m05): add GitHub MCP server configuration"
```

---

## PASO 7 — Rama `module-06/complete` (implementación completa)

```bash
git checkout -b module-06/complete
```

Esta es la rama con TODO implementado. Aquí va el código funcional completo.

### 7.1 BloomFilter<T>

Crear `src/BloomFilter.Api/DataStructures/BloomFilter.cs`:

```csharp
using System.Collections;

namespace BloomFilter.Api.DataStructures;

/// <summary>
/// Bloom Filter probabilístico thread-safe.
/// Cero falsos negativos. Tasa de falsos positivos configurable.
/// </summary>
public sealed class BloomFilter<T> where T : notnull
{
    private readonly BitArray _bits;
    private readonly int _hashCount;
    private readonly int _size;
    private readonly ReaderWriterLockSlim _lock = new();
    private int _count;

    public int Count => _count;
    public int Size => _size;
    public int HashCount => _hashCount;

    /// <param name="expectedItems">Número esperado de elementos</param>
    /// <param name="falsePositiveRate">Tasa de falsos positivos deseada (0.01 = 1%)</param>
    public BloomFilter(int expectedItems, double falsePositiveRate = 0.01)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(expectedItems);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(falsePositiveRate);
        ArgumentOutOfRangeException.ThrowIfGreaterThanOrEqual(falsePositiveRate, 1.0);

        _size = OptimalSize(expectedItems, falsePositiveRate);
        _hashCount = OptimalHashCount(_size, expectedItems);
        _bits = new BitArray(_size);
    }

    public void Add(T item)
    {
        _lock.EnterWriteLock();
        try
        {
            foreach (int pos in GetPositions(item))
                _bits[pos] = true;
            Interlocked.Increment(ref _count);
        }
        finally
        {
            _lock.ExitWriteLock();
        }
    }

    public bool ProbablyContains(T item)
    {
        _lock.EnterReadLock();
        try
        {
            foreach (int pos in GetPositions(item))
            {
                if (!_bits[pos])
                    return false;
            }
            return true;
        }
        finally
        {
            _lock.ExitReadLock();
        }
    }

    private IEnumerable<int> GetPositions(T item)
    {
        byte[] bytes = System.Text.Encoding.UTF8.GetBytes(item.ToString()!);
        int hash1 = ComputeHash(bytes, seed: 0);
        int hash2 = ComputeHash(bytes, seed: 7919);

        for (int i = 0; i < _hashCount; i++)
        {
            int combinedHash = Math.Abs((hash1 + i * hash2) % _size);
            yield return combinedHash;
        }
    }

    private static int ComputeHash(byte[] data, int seed)
    {
        unchecked
        {
            uint hash = (uint)(seed ^ 2166136261);
            foreach (byte b in data)
            {
                hash ^= b;
                hash *= 16777619;
            }
            return (int)(hash & 0x7FFFFFFF);
        }
    }

    /// <summary>m = -(n * ln(p)) / (ln(2)²)</summary>
    public static int OptimalSize(int n, double p)
        => (int)Math.Ceiling(-n * Math.Log(p) / (Math.Log(2) * Math.Log(2)));

    /// <summary>k = (m/n) * ln(2)</summary>
    public static int OptimalHashCount(int m, int n)
        => Math.Max(1, (int)Math.Round((double)m / n * Math.Log(2)));
}
```

### 7.2 DTOs (records)

Crear `src/BloomFilter.Api/Contracts.cs`:

```csharp
namespace BloomFilter.Api;

public record UsernameCheckResult(
    string Username,
    bool Available,
    string Note
);

public record RegisterRequest(string Username);

public record RegisterResponse(
    Guid Id,
    string Username,
    DateTimeOffset CreatedAt
);
```

### 7.3 Program.cs completo

Reemplazar `src/BloomFilter.Api/Program.cs`:

```csharp
using System.Text.RegularExpressions;
using BloomFilter.Api;
using BloomFilter.Api.Data;
using BloomFilter.Api.DataStructures;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// --- Services ---

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseInMemoryDatabase("BloomFilterDb"));

builder.Services.AddSingleton(sp =>
{
    int expectedItems = builder.Configuration.GetValue("BloomFilter:ExpectedItems", 1_000_000);
    double fpRate = builder.Configuration.GetValue("BloomFilter:FalsePositiveRate", 0.01);

    var filter = new BloomFilter<string>(expectedItems, fpRate);

    using var scope = sp.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    foreach (string username in db.Users.Select(u => u.Username))
    {
        filter.Add(username.ToLowerInvariant());
    }

    return filter;
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// --- App ---

var app = builder.Build();

app.UseCors();

app.MapGet("/", () => "Bloom Filter API is running");

// --- Username endpoints ---

var usernameApi = app.MapGroup("/api/username");

// Pre-check rápido (solo Bloom Filter, no toca DB)
usernameApi.MapGet("/check/{name}", (string name, BloomFilter<string> filter) =>
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

    if (!Regex.IsMatch(normalized, @"^[a-z0-9\-]+$"))
    {
        return Results.BadRequest(new
        {
            type = "https://tools.ietf.org/html/rfc9457",
            title = "Username inválido",
            status = 400,
            detail = "Solo caracteres alfanuméricos y guiones"
        });
    }

    bool probablyTaken = filter.ProbablyContains(normalized);

    return Results.Ok(new UsernameCheckResult(
        Username: normalized,
        Available: !probablyTaken,
        Note: probablyTaken
            ? "Probablemente ocupado — confirmar con registro"
            : "Disponible — el filtro garantiza que no existe"
    ));
});

// Registro real (DB + actualización del filtro)
usernameApi.MapPost("/register", async (
    RegisterRequest request,
    BloomFilter<string> filter,
    AppDbContext db) =>
{
    string normalized = request.Username.Trim().ToLowerInvariant();

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

    if (!Regex.IsMatch(normalized, @"^[a-z0-9\-]+$"))
    {
        return Results.BadRequest(new
        {
            type = "https://tools.ietf.org/html/rfc9457",
            title = "Username inválido",
            status = 400,
            detail = "Solo caracteres alfanuméricos y guiones"
        });
    }

    // Pre-check con Bloom Filter
    if (filter.ProbablyContains(normalized))
    {
        bool existsInDb = await db.Users.AnyAsync(u => u.Username == normalized);
        if (existsInDb)
        {
            return Results.Conflict(new
            {
                type = "https://tools.ietf.org/html/rfc9457",
                title = "Username no disponible",
                status = 409,
                detail = $"'{normalized}' ya está registrado"
            });
        }
        // Falso positivo del filtro — continuar con registro
    }

    var user = new User { Username = normalized };
    db.Users.Add(user);

    try
    {
        await db.SaveChangesAsync();
        filter.Add(normalized);

        return Results.Created(
            $"/api/username/{normalized}",
            new RegisterResponse(user.Id, user.Username, user.CreatedAt)
        );
    }
    catch (DbUpdateException)
    {
        return Results.Conflict(new
        {
            type = "https://tools.ietf.org/html/rfc9457",
            title = "Username no disponible",
            status = 409,
            detail = "Registrado por otro usuario simultáneamente"
        });
    }
});

// Stats del filtro (debug/demo)
usernameApi.MapGet("/stats", (BloomFilter<string> filter) =>
{
    int bitsSet = 0;
    // Estimate bits set based on count and optimal parameters
    double fillRatio = 1.0 - Math.Pow(1.0 - 1.0 / filter.Size, (double)filter.HashCount * filter.Count);
    double fpRate = Math.Pow(fillRatio, filter.HashCount);

    return Results.Ok(new
    {
        totalItems = filter.Count,
        filterSizeBits = filter.Size,
        hashFunctions = filter.HashCount,
        estimatedFillRatio = Math.Round(fillRatio, 4),
        estimatedFalsePositiveRate = Math.Round(fpRate, 6),
        memorySizeBytes = filter.Size / 8
    });
});

app.Run();

// Make Program accessible for WebApplicationFactory in tests
public partial class Program { }
```

### 7.4 Tests completos

Reemplazar `tests/BloomFilter.Tests/SmokeTests.cs` por los siguientes archivos.

Crear `tests/BloomFilter.Tests/BloomFilterTests.cs`:

```csharp
using BloomFilter.Api.DataStructures;
using FluentAssertions;

namespace BloomFilter.Tests;

public class BloomFilterTests
{
    [Fact]
    public void Add_ThenProbablyContains_ShouldReturnTrue()
    {
        // Arrange
        var filter = new BloomFilter<string>(1000, 0.01);

        // Act
        filter.Add("testuser");

        // Assert
        filter.ProbablyContains("testuser").Should().BeTrue();
    }

    [Fact]
    public void ProbablyContains_NonExistent_ShouldReturnFalse()
    {
        // Arrange
        var filter = new BloomFilter<string>(1000, 0.01);

        // Act & Assert
        filter.ProbablyContains("nonexistent").Should().BeFalse();
    }

    [Fact]
    public void Add_MultipleThenCheck_AllShouldBeFound()
    {
        // Arrange
        var filter = new BloomFilter<string>(10_000, 0.01);
        var usernames = Enumerable.Range(0, 1000).Select(i => $"user_{i}").ToList();

        // Act
        foreach (string username in usernames)
            filter.Add(username);

        // Assert — zero false negatives guaranteed
        foreach (string username in usernames)
            filter.ProbablyContains(username).Should().BeTrue();
    }

    [Fact]
    public void FalsePositiveRate_ShouldBeWithinBounds()
    {
        // Arrange
        var filter = new BloomFilter<string>(10_000, 0.01);
        for (int i = 0; i < 10_000; i++)
            filter.Add($"existing_{i}");

        // Act — check 10,000 items NOT in the filter
        int falsePositives = Enumerable.Range(0, 10_000)
            .Count(i => filter.ProbablyContains($"nonexistent_{i}"));

        // Assert — ~1% expected, allow up to 2%
        double rate = (double)falsePositives / 10_000;
        rate.Should().BeLessThan(0.02, "False positive rate should be approximately 1%");
    }

    [Fact]
    public void ConcurrentAccess_ShouldNotThrow()
    {
        // Arrange
        var filter = new BloomFilter<string>(100_000, 0.01);

        // Act & Assert — concurrent reads and writes
        Action act = () => Parallel.For(0, 10_000, i =>
        {
            filter.Add($"user_{i}");
            filter.ProbablyContains($"user_{i}");
            filter.ProbablyContains($"other_{i}");
        });

        act.Should().NotThrow();
    }

    [Fact]
    public void Count_ShouldTrackAddedItems()
    {
        // Arrange
        var filter = new BloomFilter<string>(1000, 0.01);

        // Act
        filter.Add("one");
        filter.Add("two");
        filter.Add("three");

        // Assert
        filter.Count.Should().Be(3);
    }

    [Theory]
    [InlineData(1000, 0.01)]
    [InlineData(10_000, 0.001)]
    [InlineData(1_000_000, 0.01)]
    public void OptimalSize_ShouldReturnPositiveValue(int items, double fpRate)
    {
        int size = BloomFilter<string>.OptimalSize(items, fpRate);
        size.Should().BeGreaterThan(0);
    }
}
```

Crear `tests/BloomFilter.Tests/ApiIntegrationTests.cs`:

```csharp
using System.Net;
using System.Net.Http.Json;
using BloomFilter.Api;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace BloomFilter.Tests;

public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CheckUsername_NewName_ShouldReturnAvailable()
    {
        // Act
        var response = await _client.GetAsync("/api/username/check/uniquename123");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<UsernameCheckResult>();
        result!.Available.Should().BeTrue();
        result.Username.Should().Be("uniquename123");
    }

    [Fact]
    public async Task Register_NewUsername_ShouldReturn201()
    {
        // Arrange
        var request = new RegisterRequest("newuser-test");

        // Act
        var response = await _client.PostAsJsonAsync("/api/username/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Register_ThenCheck_ShouldReturnUnavailable()
    {
        // Arrange
        string username = $"testuser-{Guid.NewGuid():N}"[..20];
        await _client.PostAsJsonAsync("/api/username/register", new RegisterRequest(username));

        // Act
        var response = await _client.GetAsync($"/api/username/check/{username}");
        var result = await response.Content.ReadFromJsonAsync<UsernameCheckResult>();

        // Assert
        result!.Available.Should().BeFalse();
    }

    [Fact]
    public async Task Register_DuplicateUsername_ShouldReturn409()
    {
        // Arrange
        string username = $"dupuser-{Guid.NewGuid():N}"[..20];
        await _client.PostAsJsonAsync("/api/username/register", new RegisterRequest(username));

        // Act
        var response = await _client.PostAsJsonAsync("/api/username/register", new RegisterRequest(username));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Theory]
    [InlineData("ab")]           // too short
    [InlineData("")]             // empty
    public async Task CheckUsername_InvalidLength_ShouldReturn400(string username)
    {
        var response = await _client.GetAsync($"/api/username/check/{username}");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Stats_ShouldReturnFilterInfo()
    {
        var response = await _client.GetAsync("/api/username/stats");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

### 7.5 Frontend React completo

Reemplazar `src/bloom-filter-ui/src/App.tsx`:

```tsx
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
```

Crear `src/bloom-filter-ui/src/hooks/useUsernameCheck.ts`:

```typescript
import { useState, useEffect } from 'react'

interface CheckResult {
  username: string
  available: boolean
  note: string
}

export function useUsernameCheck(debounceMs = 300) {
  const [username, setUsername] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (username.length < 3) {
      setResult(null)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/check/${encodeURIComponent(username)}`)
        if (res.ok) {
          const data = await res.json()
          setResult(data)
        }
      } catch {
        setResult(null)
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [username, debounceMs])

  return { username, setUsername, result, loading }
}
```

Reemplazar `src/bloom-filter-ui/src/App.css`:

```css
:root {
  --bg: #0d0d17;
  --surface: #141422;
  --border: #1a1a2e;
  --text: #ccd6f6;
  --text-muted: #5a6380;
  --green: #2ecc71;
  --red: #e74c3c;
  --teal: #1abc9c;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.container {
  max-width: 480px;
  margin: 80px auto;
  padding: 0 20px;
}

h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 32px;
}

.input-group {
  position: relative;
  margin-bottom: 12px;
}

.username-input {
  width: 100%;
  padding: 14px 48px 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.username-input:focus {
  border-color: var(--teal);
}

.indicator {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  font-weight: 700;
}

.indicator.loading { color: var(--text-muted); animation: spin 1s linear infinite; }
.indicator.available { color: var(--green); }
.indicator.taken { color: var(--red); }

@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }

.result {
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result.available { background: #0d3320; border: 1px solid #16a08560; }
.result.taken { background: #3d1515; border: 1px solid #e74c3c60; }
.result span { color: var(--text-muted); font-size: 12px; }

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
}

.register-btn:disabled { opacity: 0.4; cursor: default; }
.register-btn:hover:not(:disabled) { opacity: 0.9; }

.register-status {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 14px;
}

.register-status.success { background: #0d3320; color: var(--green); }
.register-status.error { background: #3d1515; color: var(--red); }
```

### 7.6 Configuración de la app

Crear `src/BloomFilter.Api/appsettings.json` (reemplazar si existe):

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "BloomFilter": {
    "ExpectedItems": 1000000,
    "FalsePositiveRate": 0.01
  }
}
```

En `src/BloomFilter.Api/Properties/launchSettings.json`, asegurar que el puerto es 5000:

```json
{
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "http://localhost:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

### 7.7 Verificar todo

```bash
# Backend
dotnet build
dotnet test

# Frontend
cd src/bloom-filter-ui
npm install
npm run build
cd ../..
```

Todo debe compilar y los tests deben pasar.

### 7.8 Commit final

```bash
git add .
git commit -m "feat(m06): complete implementation — BloomFilter, endpoints, tests, frontend"
```

---

## PASO 8 — Merge a main y tags

```bash
git checkout main
git merge module-06/complete -m "merge: complete course project"

# Tags por módulo (para navegación fácil)
git tag v0.0-starter starter
git tag v0.1-setup module-01/setup
git tag v0.2-instructions module-02/instructions
git tag v0.3-skills module-03/skills
git tag v0.4-agents module-04/agents
git tag v0.5-mcp module-05/mcp
git tag v1.0-complete module-06/complete
```

---

## PASO 9 — Verificación final

### Checklist de calidad

Ejecutar desde `main`:

```bash
# 1. Build limpio
dotnet build --no-incremental

# 2. Todos los tests pasan
dotnet test --verbosity normal

# 3. Frontend compila
cd src/bloom-filter-ui && npm run build && cd ../..

# 4. Archivos .github/ existen
test -f .github/copilot-instructions.md && echo "✓ instructions"
test -f .github/copilot/mcp.json && echo "✓ mcp.json"
test -f .github/skills/bloom-filter-impl/SKILL.md && echo "✓ skill: bloom-filter"
test -f .github/skills/dotnet-testing/SKILL.md && echo "✓ skill: testing"
test -f .github/skills/react-frontend/SKILL.md && echo "✓ skill: react"
test -f .github/agents/planner.agent.md && echo "✓ agent: planner"
test -f .github/agents/dotnet-api.agent.md && echo "✓ agent: builder"
test -f .github/agents/code-reviewer.agent.md && echo "✓ agent: reviewer"

# 5. Estructura de ramas
git branch -a

# 6. API funciona (arrancar y probar)
cd src/BloomFilter.Api && dotnet run &
sleep 3
curl -s http://localhost:5000/api/username/check/testuser | python3 -m json.tool
curl -s -X POST http://localhost:5000/api/username/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}' | python3 -m json.tool
curl -s http://localhost:5000/api/username/check/testuser | python3 -m json.tool
curl -s http://localhost:5000/api/username/stats | python3 -m json.tool
kill %1
```

### Resultado esperado de los curls

1. `check/testuser` → `{ "available": true }`
2. `register testuser` → `201 Created`
3. `check/testuser` → `{ "available": false }`
4. `stats` → info del filtro

---

## Resumen de archivos por rama

| Rama | Archivos nuevos |
|---|---|
| `starter` | Scaffolding .NET + React vacío |
| `module-01/setup` | `User.cs`, `AppDbContext.cs`, NuGet packages |
| `module-02/instructions` | `.github/copilot-instructions.md` |
| `module-03/skills` | 3 × `SKILL.md` en `.github/skills/` |
| `module-04/agents` | 3 × `.agent.md` en `.github/agents/` |
| `module-05/mcp` | `.github/copilot/mcp.json` |
| `module-06/complete` | `BloomFilter.cs`, `Contracts.cs`, `Program.cs` completo, tests, frontend |
| `main` | Merge final |
