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
