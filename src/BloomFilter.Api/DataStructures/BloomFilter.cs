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

    /// <summary>
    /// Devuelve una muestra de los primeros <paramref name="sampleSize"/> bits del filtro
    /// como array de 0/1. Útil para visualización pedagógica en el frontend.
    /// </summary>
    public int[] GetBitsSample(int sampleSize = 256)
    {
        _lock.EnterReadLock();
        try
        {
            int effectiveSize = Math.Min(sampleSize, _size);
            var sample = new int[effectiveSize];
            for (int i = 0; i < effectiveSize; i++)
                sample[i] = _bits[i] ? 1 : 0;
            return sample;
        }
        finally
        {
            _lock.ExitReadLock();
        }
    }

    /// <summary>
    /// Devuelve las posiciones que generaría un ítem si se añadiera, sin modificar
    /// el filtro. Útil para visualizar qué bits dispara un username concreto.
    /// </summary>
    public int[] GetPositionsFor(T item)
    {
        return GetPositions(item).ToArray();
    }

    /// <summary>m = -(n * ln(p)) / (ln(2)²)</summary>
    public static int OptimalSize(int n, double p)
        => (int)Math.Ceiling(-n * Math.Log(p) / (Math.Log(2) * Math.Log(2)));

    /// <summary>k = (m/n) * ln(2)</summary>
    public static int OptimalHashCount(int m, int n)
        => Math.Max(1, (int)Math.Round((double)m / n * Math.Log(2)));
}
