# INSTRUCCIONES PARA CLAUDE CODE — Módulo 8: OpenAPI + Scalar (Bonus)

## Contexto

Este documento contiene las instrucciones para generar el **Módulo 8 (bonus)**
del curso "GitHub Copilot: Skills, Agents y MCP". Parte del estado del repo
al final del M7: proyecto con visualización pedagógica pero sin documentación
interactiva de la API.

**Objetivo pedagógico**: enseñar a añadir una feature cross-cutting de
backend (instalar un paquete NuGet + configurar middleware) usando los skills
y agents existentes. Es el caso más común en la vida real: un jefe pide
"quiero ver los endpoints de mi API en una UI interactiva", y el dev tiene
que instalar algo, activar un middleware, y añadir metadata. Con Copilot,
el Planner puede incluso consultar la doc del paquete vía `web/fetch`.

Los bonus del curso ya enseñan:
- **M7**: iterar sobre UI existente alimentando un artefacto visual (feed by example)
- **M8**: añadir una feature cross-cutting de backend con un paquete NuGet
- **M9**: añadir una feature nueva full-stack (endpoint + UI) — módulo hermano

Es un capítulo opcional de ~8-10 min que se graba como sesión independiente.

---

## Precondiciones

Antes de empezar, el repo debe estar en:

- Rama activa: `module-07/visual` (o posterior).
- `dotnet build` limpio, `dotnet test` verde (20 tests), `npm run build` OK.
- El paquete `Microsoft.AspNetCore.OpenApi` **ya está instalado** desde M1
  (`src/BloomFilter.Api/BloomFilter.Api.csproj`). No hay que añadirlo otra vez,
  solo activarlo.
- Los 3 agents del M4 están disponibles.
- Los 4 skills existentes: `bloom-filter-impl`, `dotnet-testing`, `react-frontend`, `visual-design`.

Si alguna condición no se cumple, **PARAR** y avisar.

---

## Estrategia de rama y commits

```
module-07/visual
  └── module-08/scalar    ← Bonus: OpenAPI + Scalar
       └── (merge a main)
```

4 commits en total, todos con `refs #10`.

---

## PASO 0 — Crear la rama

```bash
git checkout module-07/visual
git pull
git checkout -b module-08/scalar
```

---

## PASO 1 — Nuevo skill `api-documentation`

Crear `.github/skills/api-documentation/SKILL.md`:

```markdown
---
name: api-documentation
description: >
  Añade documentación interactiva a una API .NET 10 Minimal API usando
  el generador OpenAPI nativo de ASP.NET Core y Scalar como renderer.
  Usa este skill cuando necesites exponer un spec OpenAPI, añadir metadata
  a endpoints (WithTags, WithName, Produces), o instalar Scalar para tener
  una UI moderna de documentación.
---

# API Documentation — OpenAPI + Scalar

## Paquetes

- `Microsoft.AspNetCore.OpenApi` (ya incluido en el proyecto desde M1) —
  genera el spec OpenAPI 3.1 desde los metadatos de los endpoints.
- `Scalar.AspNetCore` — renderer moderno tipo Swagger/Redoc, con modo oscuro
  por defecto, tema configurable y soporte de operation IDs.

```bash
dotnet add package Scalar.AspNetCore
```

## Activación en Program.cs

```csharp
// Servicios
builder.Services.AddOpenApi();

// Pipeline (solo en Development para no exponer en producción)
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("Bloom Filter API");
    });
}
```

El JSON del spec queda en `/openapi/v1.json`. La UI en `/scalar/v1`.

## Metadata de endpoints

Añade `.WithTags()`, `.WithName()` y `.Produces*()` a cada endpoint para
que Scalar los agrupe y documente las respuestas esperadas.

```csharp
usernameApi.MapGet("/check/{name}", (string name, BloomFilter<string> filter) => { /* ... */ })
    .WithTags("Username")
    .WithName("CheckUsername")
    .Produces<UsernameCheckResult>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status400BadRequest);

usernameApi.MapPost("/register", async (...) => { /* ... */ })
    .WithTags("Username")
    .WithName("RegisterUsername")
    .Produces<RegisterResponse>(StatusCodes.Status201Created)
    .ProducesProblem(StatusCodes.Status400BadRequest)
    .ProducesProblem(StatusCodes.Status409Conflict);
```

### Convenciones

- **`WithTags`**: agrupa endpoints en la UI. Usa grupos temáticos del dominio
  (aquí: `Username` para check/register/list, `Filter` para stats/visualize).
- **`WithName`**: genera operation IDs estables para generadores de clientes
  (`CheckUsername`, `RegisterUsername`...). Usa PascalCase.
- **`Produces<T>`**: declara el tipo de respuesta para cada status code.
  Scalar lo renderiza como ejemplo en la UI.
- **`ProducesProblem`**: declara respuestas de error con ProblemDetails
  (RFC 9457) — mantiene coherencia con las convenciones del proyecto.

## Seguridad

Exponer OpenAPI + Scalar **solo en Development**. En Production queda oculto
detrás del `if (app.Environment.IsDevelopment())`. Si necesitas documentación
en un entorno staging, usa un middleware de autenticación previo.

## Testing

Verifica que el spec se sirve correctamente:

```csharp
[Fact]
public async Task OpenApi_Document_ShouldBeAvailable_InDevelopment()
{
    // WebApplicationFactory arranca en Production por defecto → forzar Development
    var factory = _factory.WithWebHostBuilder(b => b.UseEnvironment("Development"));
    var client = factory.CreateClient();

    var response = await client.GetAsync("/openapi/v1.json");
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var json = await response.Content.ReadAsStringAsync();
    json.Should().Contain("\"openapi\"");
    json.Should().Contain("/api/username/check/{name}");
}
```
```

Commit:

```bash
git add .github/skills/api-documentation/
git commit -m "feat(m08): add api-documentation skill

refs #10"
```

---

## PASO 2 — Instalar Scalar y activar OpenAPI

### 2.1 Instalar paquete

```bash
cd src/BloomFilter.Api
dotnet add package Scalar.AspNetCore
cd ../..
```

### 2.2 Modificar `src/BloomFilter.Api/Program.cs`

Añadir el `using` al principio:

```csharp
using Scalar.AspNetCore;
```

En la sección `// --- Services ---` (después de `AddCors`), añadir:

```csharp
builder.Services.AddOpenApi();
```

Reemplazar la línea `app.UseCors();` por:

```csharp
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("Bloom Filter API");
    });
}
```

### 2.3 Añadir metadata a los endpoints

Modificar los 4 endpoints del `MapGroup("/api/username")`. Para cada uno,
añadir `.WithTags()`, `.WithName()` y (donde aplique) `.Produces*()`:

```csharp
usernameApi.MapGet("/check/{name}", ...)
    .WithTags("Username")
    .WithName("CheckUsername")
    .Produces<UsernameCheckResult>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status400BadRequest);

usernameApi.MapPost("/register", ...)
    .WithTags("Username")
    .WithName("RegisterUsername")
    .Produces<RegisterResponse>(StatusCodes.Status201Created)
    .ProducesProblem(StatusCodes.Status400BadRequest)
    .ProducesProblem(StatusCodes.Status409Conflict);

usernameApi.MapGet("/stats", ...)
    .WithTags("Filter")
    .WithName("GetStats");

usernameApi.MapGet("/visualize/{name}", ...)
    .WithTags("Filter")
    .WithName("VisualizeUsername")
    .ProducesProblem(StatusCodes.Status400BadRequest);
```

### 2.4 Verificar y commit

```bash
dotnet build
git add -A
git commit -m "feat(m08): activate OpenAPI and Scalar UI (dev-only)

- AddOpenApi() in services
- MapOpenApi() + MapScalarApiReference() in Development pipeline
- .WithTags() and .WithName() on all 4 /api/username/* endpoints
- .Produces<T>() / .ProducesProblem() for documented responses
- Scalar UI at /scalar/v1, JSON spec at /openapi/v1.json

refs #10"
```

---

## PASO 3 — Test de integración para OpenAPI

Añadir al final de `tests/BloomFilter.Tests/ApiIntegrationTests.cs`
(antes del cierre de la clase):

```csharp
[Fact]
public async Task OpenApi_Document_ShouldBeAvailable_InDevelopment()
{
    // WebApplicationFactory arranca en Production por defecto.
    // MapOpenApi() está dentro del if (IsDevelopment), así que hay que forzar el entorno.
    using var factory = new WebApplicationFactory<Program>()
        .WithWebHostBuilder(builder => builder.UseEnvironment("Development"));
    using var client = factory.CreateClient();

    var response = await client.GetAsync("/openapi/v1.json");

    response.StatusCode.Should().Be(HttpStatusCode.OK);
    string json = await response.Content.ReadAsStringAsync();
    json.Should().Contain("\"openapi\"");
    json.Should().Contain("/api/username/check/{name}");
    json.Should().Contain("/api/username/register");
}
```

Nota: este test crea su propia `WebApplicationFactory` (no usa `_factory`
del fixture) porque necesita un entorno distinto. Eso garantiza aislamiento
y no afecta a los otros 20 tests.

Verificar y commit:

```bash
dotnet build
dotnet test
git add tests/BloomFilter.Tests/ApiIntegrationTests.cs
git commit -m "test(m08): verify /openapi/v1.json is served in Development

refs #10"
```

---

## PASO 4 — Verificación end-to-end

```bash
dotnet build --no-incremental
dotnet test --verbosity normal

# Checklist de archivos
test -f .github/skills/api-documentation/SKILL.md && echo "✓ skill"
grep -q "Scalar.AspNetCore" src/BloomFilter.Api/BloomFilter.Api.csproj && echo "✓ package"
grep -q "AddOpenApi" src/BloomFilter.Api/Program.cs && echo "✓ services"
grep -q "MapScalarApiReference" src/BloomFilter.Api/Program.cs && echo "✓ pipeline"
grep -q "WithTags" src/BloomFilter.Api/Program.cs && echo "✓ metadata"
```

Esperado: `dotnet test` devuelve **21/21 verdes** (20 previos + 1 nuevo).

### Verificación manual (Pedro, con DevLauncher)

1. Arrancar backend + frontend.
2. Abrir `http://localhost:5000/openapi/v1.json` → JSON con los 4 endpoints tageados.
3. Abrir `http://localhost:5000/scalar/v1` → UI de Scalar con dos grupos
   ("Username" y "Filter") y los operation IDs en PascalCase.
4. El frontend `http://localhost:5173` sigue funcionando igual (Scalar no lo toca).

---

## PASO 5 — Push, tag y merge

```bash
git log --oneline module-07/visual..module-08/scalar
git push -u origin module-08/scalar

# Tag
git tag v1.2-scalar module-08/scalar
git push origin v1.2-scalar

# Merge a main
git checkout main
git merge module-08/scalar --no-ff -m "merge: M8 bonus OpenAPI + Scalar into main

Closes #10."
git push origin main
```

Cerrar issue #10 vía MCP con el commit del merge.

---

## Resumen del M8

| Elemento | Archivos |
|---|---|
| Nuevo skill | `.github/skills/api-documentation/SKILL.md` |
| Backend | `BloomFilter.Api.csproj` (+`Scalar.AspNetCore`), `Program.cs` (+`AddOpenApi`, `MapOpenApi`, `MapScalarApiReference`, 8 extensiones de metadata) |
| Tests añadidos | 1 en `ApiIntegrationTests.cs` (21 totales) |

**Concepto pedagógico clave**: Copilot no solo scaffolda y refactoriza UI.
También hace "fontanería" de backend — instalar paquetes, activar middleware,
añadir metadata. El Planner puede usar `web/fetch` para consultar la doc de
Scalar antes de generar el plan, demostrando cómo los agents investigan
dependencias externas.
