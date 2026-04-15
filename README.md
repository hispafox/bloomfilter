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
├── copilot-instructions.md      # Convenciones del proyecto (M2)
├── copilot/mcp.json             # GitHub MCP Server config (M5)
├── agents/                      # Custom Agents (M4)
└── skills/                      # Agent Skills (M3)
src/
├── BloomFilter.Api/             # Backend .NET 10
└── bloom-filter-ui/             # Frontend React + TypeScript
tests/
└── BloomFilter.Tests/           # Tests xUnit
docs/                            # Material del curso
demo/                            # Prototipo React standalone
```

## Ramas del curso

Cada rama corresponde al estado del proyecto al final de un módulo:

| Rama | Módulo | Qué añade |
|---|---|---|
| `starter` | — | Esqueleto vacío compilable |
| `module-01/setup` | M1 | User entity + EF InMemory |
| `module-02/instructions` | M2 | Custom Instructions |
| `module-03/skills` | M3 | Agent Skills |
| `module-04/agents` | M4 | Custom Agents |
| `module-05/mcp` | M5 | GitHub MCP |
| `module-06/complete` | M6 | Implementación completa |
| `main` | — | Estado final (merge de `module-06/complete`) |
