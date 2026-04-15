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
