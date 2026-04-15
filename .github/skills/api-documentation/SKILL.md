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

Verifica que el spec se sirve correctamente. `WebApplicationFactory` arranca
en Production por defecto, así que hay que forzar Development:

```csharp
[Fact]
public async Task OpenApi_Document_ShouldBeAvailable_InDevelopment()
{
    using var factory = new WebApplicationFactory<Program>()
        .WithWebHostBuilder(b => b.UseEnvironment("Development"));
    using var client = factory.CreateClient();

    var response = await client.GetAsync("/openapi/v1.json");
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var json = await response.Content.ReadAsStringAsync();
    json.Should().Contain("\"openapi\"");
    json.Should().Contain("/api/username/check/{name}");
}
```
