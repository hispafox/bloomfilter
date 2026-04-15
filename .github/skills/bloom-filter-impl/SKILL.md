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
