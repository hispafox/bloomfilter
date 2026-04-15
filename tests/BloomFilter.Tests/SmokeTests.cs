using FluentAssertions;

namespace BloomFilter.Tests;

public class SmokeTests
{
    [Fact]
    public void Project_ShouldCompile()
    {
        true.Should().BeTrue();
    }
}
