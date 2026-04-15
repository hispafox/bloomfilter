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
