# GitHub Copilot: Skills, Agents y MCP — De cero a flujo profesional en 2 horas

## Ficha técnica

| Campo | Valor |
|---|---|
| **Duración** | 2 horas (120 min) |
| **Formato** | Workshop / Formación grabada |
| **Audiencia** | Desarrolladores con experiencia que ya usan Copilot para autocompletar pero no conocen skills, agents ni MCP |
| **Nivel** | Intermedio (saben programar, saben usar un IDE, han visto Copilot) |
| **Proyecto práctico** | Bloom Filter API (.NET 10 + React) — username availability checker al estilo Gmail |
| **Producción** | Claude (contenido) → Gamma (slides) → HeyGen (locución) + Screencast (demos) |
| **Stack del curso** | VS Code + GitHub Copilot + GitHub MCP Server + .NET 10 |

---

## La tesis del curso en una frase

Copilot no es un chatbot con autocompletado — es un sistema de agentes especializados que puedes enseñar, limitar y conectar con tu infraestructura real, y en 2 horas vas a montarlo desde cero.

---

## Estructura de módulos

```
M1  Contexto + Setup           15 min  (7 slides, 0 demos)
M2  Custom Instructions        15 min  (5 slides, 1 demo — 5 min)
M3  Agent Skills               25 min  (8 slides, 1 demo — 10 min)
M4  Custom Agents              25 min  (8 slides, 1 demo — 10 min)
M5  GitHub MCP                 20 min  (7 slides, 1 demo — 8 min)
M6  Flujo completo E2E         20 min  (5 slides, 1 demo — 12 min)
─────────────────────────────────────────────────────────
TOTAL                          120 min  (40 slides, 5 demos — 45 min)
```

---

## Módulo 1 — Contexto + Setup (15 min)

**Objetivo:** Situar al alumno en el Copilot de 2026, no en el de 2023. Dejar claro que lo que van a ver no es autocompletado — es un ecosistema de agentes con memoria, herramientas y conexiones externas. Montar el proyecto base para las demos.

### Slides

| Slide | Tipo | Contenido |
|---|---|---|
| 1 | Portada | Título del curso, proyecto práctico, qué van a construir |
| 2 | Concepto | Copilot en 2026: de autocompletado a sistema de agentes (timeline visual) |
| 3 | Concepto | Las 3 capas: Instructions (siempre) → Skills (bajo demanda) → Agents (roles) |
| 4 | Concepto | El proyecto: Bloom Filter — qué es, por qué Gmail lo usa, qué vamos a construir |
| 5 | Diagrama | Arquitectura del proyecto: React → API .NET → BloomFilter (RAM) → DB (UNIQUE) |
| 6 | Código | Estructura del repositorio que vamos a montar (árbol de carpetas) |
| 7 | Concepto | Qué van a saber hacer en 2 horas (contrato con el alumno) |

### Documentos de este módulo
- `m01-slides.md` — Slides para Gamma
- `m01-locucion.md` — Locución para HeyGen

---

## Módulo 2 — Custom Instructions (15 min)

**Objetivo:** Que el alumno entienda la capa base — las instrucciones que Copilot lee SIEMPRE, en cada interacción. La diferencia entre un Copilot genérico y uno que conoce tu proyecto.

### Slides

| Slide | Tipo | Contenido |
|---|---|---|
| 8 | Portada módulo | Custom Instructions: el ADN de tu proyecto |
| 9 | Concepto | Qué son, dónde van (.github/copilot-instructions.md), cuándo se aplican |
| 10 | Código | Anatomía de un buen copilot-instructions.md (el del Bloom Filter) |
| 11 | Comparativa | Antes/después: Copilot sin instrucciones vs con instrucciones (mismo prompt, resultado diferente) |
| 12 | Concepto | Cuándo usar instructions vs skills vs agents (regla de decisión) |

### Demo 1 — Custom Instructions en acción (~5 min)
**Qué se graba:** Crear el archivo copilot-instructions.md en el repo, pedir a Copilot que genere un endpoint, ver cómo aplica las convenciones (Minimal API, TypedResults, record types) SIN que el alumno las mencione en el prompt.
**Momento "ajá":** Borrar las instrucciones, repetir el mismo prompt, ver que ahora genera Controllers con Results.Ok genérico. La diferencia es brutal.

### Documentos de este módulo
- `m02-slides.md` — Slides para Gamma
- `m02-locucion.md` — Locución para HeyGen
- `m02-demo.md` — Plan de demo con screencast

---

## Módulo 3 — Agent Skills (25 min)

**Objetivo:** Que el alumno sepa crear skills reutilizables — paquetes de conocimiento que Copilot carga bajo demanda cuando detecta que son relevantes. El Bloom Filter implementation skill como caso real.

### Slides

| Slide | Tipo | Contenido |
|---|---|---|
| 13 | Portada módulo | Agent Skills: enseñarle a Copilot cómo se hacen las cosas aquí |
| 14 | Concepto | Qué es un skill: carpeta con SKILL.md + recursos. No es un prompt — es conocimiento empaquetado |
| 15 | Diagrama | Progressive Disclosure: Copilot lee la descripción → si encaja, carga el SKILL.md → si necesita más, lee los recursos |
| 16 | Código | Anatomía del SKILL.md: frontmatter YAML (name, description) + cuerpo Markdown con instrucciones |
| 17 | Código | El skill bloom-filter-impl/ — implementación de referencia, fórmulas, patrón de dos capas |
| 18 | Concepto | Dónde viven los skills: proyecto (.github/skills/), personal (~/.copilot/skills/), el spec abierto de agentskills.io |
| 19 | Código | El skill dotnet-testing/ — patrones de test para estructuras probabilísticas |
| 20 | Concepto | Skills vs Instructions: instructions = siempre activas (estándares), skills = bajo demanda (procedimientos) |

### Demo 2 — Creando y usando un Skill (~10 min)
**Qué se graba:** Crear el skill bloom-filter-impl/ desde cero. Escribir el SKILL.md con la implementación de referencia. Pedir a Copilot "implementa el endpoint de check de usernames" y ver cómo carga el skill automáticamente (aparece el indicador en el chat). El código generado sigue la implementación de referencia del skill.
**Momento "ajá":** Invocar el skill manualmente con /bloom-filter-impl para ver qué pasa cuando lo fuerzas. Luego eliminar el skill y repetir el prompt — el resultado es un HashSet genérico, no un Bloom Filter.

### Documentos de este módulo
- `m03-slides.md` — Slides para Gamma
- `m03-locucion.md` — Locución para HeyGen
- `m03-demo.md` — Plan de demo con screencast

---

## Módulo 4 — Custom Agents (25 min)

**Objetivo:** Que el alumno entienda que los agents son roles con herramientas restringidas, y que los handoffs encadenan flujos complejos. El Planner, el Builder y el Reviewer como ejemplo real.

### Slides

| Slide | Tipo | Contenido |
|---|---|---|
| 21 | Portada módulo | Custom Agents: roles con criterio, no bots con acceso a todo |
| 22 | Concepto | Qué es un agent: .agent.md = persona + tools + instrucciones. El archivo ES el rol |
| 23 | Código | Anatomía del .agent.md: frontmatter (name, description, tools, model, handoffs) + cuerpo con instrucciones |
| 24 | Código | planner.agent.md — genera planes, no código. Tools: search + GitHub MCP (create_issue) |
| 25 | Código | dotnet-api.agent.md — implementa siguiendo skills. Tools: read + edit + terminal |
| 26 | Código | code-reviewer.agent.md — solo revisa, nunca modifica. Tools: read + search (sin edit) |
| 27 | Diagrama | Handoffs: Planner → Builder → Reviewer. Cada transición pasa contexto, no repite trabajo |
| 28 | Concepto | Agents vs Skills vs Instructions: cuándo usar cada capa (tabla de decisión definitiva) |

### Demo 3 — Agents con Handoffs (~10 min)
**Qué se graba:** Seleccionar el agente Planner en VS Code. Pedirle que planifique el endpoint de register. Ver que genera un plan Markdown (no código). Hacer clic en el handoff "Implementar en .NET". Ver que el agente cambia a .NET API Builder y empieza a generar código siguiendo el plan. Señalar que el Builder tiene acceso a edit y terminal, pero el Planner no lo tenía.
**Momento "ajá":** Intentar hacer un edit de archivo con el Planner seleccionado — no puede. Cambiar al Builder — ahora sí. Los tools definen lo que cada rol puede hacer.

### Documentos de este módulo
- `m04-slides.md` — Slides para Gamma
- `m04-locucion.md` — Locución para HeyGen
- `m04-demo.md` — Plan de demo con screencast

---

## Módulo 5 — GitHub MCP (20 min)

**Objetivo:** Que el alumno conecte Copilot con GitHub para crear issues, consultar PRs y gestionar el repositorio sin salir del IDE. El MCP server remoto como punto de integración.

### Slides

| Slide | Tipo | Contenido |
|---|---|---|
| 29 | Portada módulo | GitHub MCP: tu repo dentro del chat |
| 30 | Concepto | Qué es MCP (Model Context Protocol) — el "USB de la IA" que conecta agentes con servicios externos |
| 31 | Diagrama | Copilot ↔ MCP Server ↔ GitHub API. OAuth automático, sin tokens manuales |
| 32 | Código | Configuración: .github/copilot/mcp.json con el server remoto (api.githubcopilot.com/mcp/) |
| 33 | Concepto | Toolsets: issues, pull_requests, repos, context. Habilitar solo lo que necesitas |
| 34 | Código | Cómo un agent usa MCP: tools: ["github/create_issue", "github/list_issues"] en el .agent.md |
| 35 | Concepto | Read-only mode, dynamic toolsets, governance para Enterprise |

### Demo 4 — Creando Issues desde el Chat (~8 min)
**Qué se graba:** Configurar el MCP server remoto (copiar el mcp.json). Autorizar con OAuth (un clic). En el chat de Copilot, pedir "crea un issue para implementar el endpoint de register del Bloom Filter con acceptance criteria". Ver que Copilot usa create_issue, el issue aparece en GitHub con labels y body.
**Momento "ajá":** Pedir "lista los issues abiertos del proyecto y dime cuáles están sin asignar". Copilot consulta list_issues y responde con datos reales del repo. No es un chatbot genérico — está leyendo tu proyecto.

### Documentos de este módulo
- `m05-slides.md` — Slides para Gamma
- `m05-locucion.md` — Locución para HeyGen
- `m05-demo.md` — Plan de demo con screencast

---

## Módulo 6 — Flujo Completo E2E (20 min)

**Objetivo:** Juntar todo. Un flujo real de principio a fin: issue → plan → implementación → review → PR. El alumno ve las tres capas trabajando juntas con MCP de fondo.

### Slides

| Slide | Tipo | Contenido |
|---|---|---|
| 36 | Portada módulo | Todo junto: de issue a pull request sin salir del IDE |
| 37 | Diagrama | El flujo completo: Issue (MCP) → Planner (agent) → Builder (agent + skills) → Reviewer (agent) → PR (MCP) |
| 38 | Concepto | Qué se ha ganado: cada capa aporta algo diferente — sin skills, el código es genérico; sin agents, no hay roles; sin MCP, hay que copiar y pegar entre GitHub y el IDE |
| 39 | Concepto | Más allá del curso: Copilot cloud agent (asignar issues a Copilot), MCP con Slack/Notion/Jira, skills compartidos en awesome-copilot |
| 40 | Cierre | Recursos, repo del proyecto, próximos pasos |

### Demo 5 — El flujo E2E (~12 min)
**Qué se graba:** Arranca con un issue ya creado en GitHub ("Implementar endpoint de check con Bloom Filter"). Seleccionar Planner → genera el plan. Handoff a Builder → implementa endpoint + tests siguiendo el skill. Handoff a Reviewer → revisa y genera informe (encuentra un warning de thread-safety). Volver al Builder → corregir el warning. Pedir a Copilot "crea un PR con estos cambios". Ver el PR creado en GitHub desde el chat.
**Momento "ajá":** El flujo entero sin tocar el navegador ni GitHub.com. Todo desde VS Code.

### Documentos de este módulo
- `m06-slides.md` — Slides para Gamma
- `m06-locucion.md` — Locución para HeyGen
- `m06-demo.md` — Plan de demo con screencast

---

## Resumen de entregables por módulo

Cada módulo genera 2-3 documentos:

| Módulo | Slides | Locución | Demo | Total docs |
|---|---|---|---|---|
| M1 — Contexto + Setup | ✓ | ✓ | — | 2 |
| M2 — Custom Instructions | ✓ | ✓ | ✓ | 3 |
| M3 — Agent Skills | ✓ | ✓ | ✓ | 3 |
| M4 — Custom Agents | ✓ | ✓ | ✓ | 3 |
| M5 — GitHub MCP | ✓ | ✓ | ✓ | 3 |
| M6 — Flujo E2E | ✓ | ✓ | ✓ | 3 |
| **TOTAL** | **6** | **6** | **5** | **17** |

Además, 2 documentos transversales:
- `curso-specs.md` — Specs del proyecto Bloom Filter (descargable para el alumno)
- `curso-recursos.md` — Links, requisitos previos, repo del proyecto

**Total de documentos a desarrollar: 19**

---

## Distribución del tiempo (desglose fino)

```
00:00 — 00:15  M1  Contexto + Setup              7 slides, narración
00:15 — 00:25  M2  Custom Instructions (slides)    5 slides, narración
00:25 — 00:30  M2  Demo 1 (instructions)           screencast 5 min
00:30 — 00:45  M3  Agent Skills (slides)            8 slides, narración
00:45 — 00:55  M3  Demo 2 (skill en acción)         screencast 10 min
00:55 — 01:10  M4  Custom Agents (slides)           8 slides, narración
01:10 — 01:20  M4  Demo 3 (agents + handoffs)       screencast 10 min
01:20 — 01:32  M5  GitHub MCP (slides)              7 slides, narración
01:32 — 01:40  M5  Demo 4 (issues desde chat)       screencast 8 min
01:40 — 01:48  M6  Flujo E2E (slides)               5 slides, narración
01:48 — 02:00  M6  Demo 5 (issue → PR completo)     screencast 12 min
```

---

## Hilo conductor narrativo

El proyecto Bloom Filter no es decorativo — es el hilo que conecta todo:

- **M1**: "Esto es lo que vamos a construir" → el alumno entiende el proyecto
- **M2**: Las instructions definen las convenciones del proyecto → Copilot genera Minimal API, no Controllers
- **M3**: El skill contiene la implementación de referencia del Bloom Filter → Copilot sabe implementar un filtro probabilístico
- **M4**: Cada agent tiene un rol distinto sobre el mismo proyecto → el Planner planifica, el Builder construye, el Reviewer revisa
- **M5**: MCP conecta todo con GitHub → los issues del proyecto se crean y consultan desde el chat
- **M6**: Todo junto → desde un issue del Bloom Filter hasta un PR listo para merge

El alumno construye UNA cosa, pero la ve desde 5 ángulos diferentes. Al final, tiene el proyecto completo Y sabe repetir el patrón con cualquier proyecto propio.

---

## Orden de desarrollo de documentos

Para mantener coherencia, el orden de escritura recomendado es:

1. **curso-specs.md** — El proyecto primero. Todo se construye sobre esto.
2. **curso-recursos.md** — Requisitos y links. Se referencia desde el M1.
3. **M1 slides + locución** — El contexto necesita el proyecto definido.
4. **M2 slides + locución + demo** — La capa base. Las demos se encadenan.
5. **M3 slides + locución + demo**
6. **M4 slides + locución + demo**
7. **M5 slides + locución + demo**
8. **M6 slides + locución + demo** — El cierre depende de que todo lo anterior esté sólido.
