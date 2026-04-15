# Guía de Recursos — GitHub Copilot: Skills, Agents y MCP

## Requisitos previos

### Software necesario
- **VS Code** (última versión estable) — [code.visualstudio.com](https://code.visualstudio.com)
- **GitHub Copilot** (extensión de VS Code) — requiere suscripción Pro, Business o Enterprise
- **.NET 10 SDK** — [dot.net/download](https://dot.net/download)
- **Node.js 22+** — [nodejs.org](https://nodejs.org)
- **Git** — configurado con tu cuenta de GitHub
- **SQL Server** — LocalDB (viene con Visual Studio) o Docker: `docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=Str0ngP@ss!" -p 1433:1433 mcr.microsoft.com/mssql/server:2022-latest`

### Configuración de VS Code
- Extensión **GitHub Copilot** instalada y autenticada
- Extensión **GitHub Copilot Chat** instalada
- Agent mode habilitado (viene por defecto en VS Code 2026)
- Configuración MCP habilitada: `github.copilot.chat.mcp.enabled: true`

### Conocimientos previos
- C# básico (variables, clases, métodos async)
- Haber usado Copilot para autocompletar código (el nivel de "Tab Tab Tab")
- Saber crear un proyecto .NET desde CLI (`dotnet new webapi`)
- Git básico (commit, push, pull)

---

## Repositorio del proyecto

**URL:** [github.com/tu-usuario/bloom-filter-dotnet](https://github.com)

El repositorio contiene:
- Código fuente completo (backend + frontend)
- Toda la estructura .github/ con skills, agents y MCP config
- Rama `main` con el proyecto terminado
- Rama `starter` con el esqueleto vacío para seguir el curso
- README con instrucciones de setup

### Clonar y arrancar

```bash
git clone https://github.com/tu-usuario/bloom-filter-dotnet.git
cd bloom-filter-dotnet
git checkout starter

# Backend
cd src/BloomFilter.Api
dotnet restore
dotnet run

# Frontend (otra terminal)
cd src/bloom-filter-ui
npm install
npm run dev
```

---

## Documentación oficial

### GitHub Copilot
- [Custom Instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions) — Cómo crear copilot-instructions.md
- [Agent Skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills) — Crear y usar SKILL.md
- [Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents) — Crear .agent.md con handoffs
- [Agent Skills Spec](https://agentskills.io) — El estándar abierto (compatible con Copilot, Claude Code, Cursor, etc.)

### GitHub MCP Server
- [Setup Guide](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/set-up-the-github-mcp-server) — Configuración remota y local
- [Using the MCP Server](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/use-the-github-mcp-server) — Crear issues, PRs y más desde el chat
- [GitHub MCP Server Repo](https://github.com/github/github-mcp-server) — Código fuente, toolsets, configuración avanzada
- [Practical Guide](https://github.blog/ai-and-ml/generative-ai/a-practical-guide-on-how-to-use-the-github-mcp-server/) — Tutorial oficial del blog de GitHub

### Comunidad
- [awesome-copilot](https://github.com/github/awesome-copilot) — Skills, agents e instrucciones compartidas por la comunidad
- [anthropics/skills](https://github.com/anthropics/skills) — Skills de referencia de Anthropic (compatibles con Copilot)

### .NET 10
- [Minimal APIs](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis) — Documentación oficial
- [EF Core 10](https://learn.microsoft.com/en-us/ef/core/) — Entity Framework Core

---

## Archivos descargables del curso

| Archivo | Descripción |
|---|---|
| `bloom-filter-copilot-setup.zip` | Estructura .github/ completa (skills, agents, MCP) lista para copiar |
| `curso-specs.md` | Especificación completa del proyecto |
| `bloom-filter-demo.jsx` | Demo interactiva del Bloom Filter (React) |

---

## Soporte durante el curso

- **Issues del repo**: Para dudas técnicas sobre el proyecto
- **Discussions del repo**: Para preguntas sobre el contenido del curso
- Cada demo tiene un checkpoint — si algo falla, la rama `main` tiene la solución completa
