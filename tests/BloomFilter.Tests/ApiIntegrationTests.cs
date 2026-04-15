using System.Net;
using System.Net.Http.Json;
using BloomFilter.Api;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace BloomFilter.Tests;

public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CheckUsername_NewName_ShouldReturnAvailable()
    {
        // Act
        var response = await _client.GetAsync("/api/username/check/uniquename123");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<UsernameCheckResult>();
        result!.Available.Should().BeTrue();
        result.Username.Should().Be("uniquename123");
    }

    [Fact]
    public async Task Register_NewUsername_ShouldReturn201()
    {
        // Arrange
        var request = new RegisterRequest("newuser-test");

        // Act
        var response = await _client.PostAsJsonAsync("/api/username/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Register_ThenCheck_ShouldReturnUnavailable()
    {
        // Arrange
        string username = $"testuser-{Guid.NewGuid():N}"[..20];
        await _client.PostAsJsonAsync("/api/username/register", new RegisterRequest(username));

        // Act
        var response = await _client.GetAsync($"/api/username/check/{username}");
        var result = await response.Content.ReadFromJsonAsync<UsernameCheckResult>();

        // Assert
        result!.Available.Should().BeFalse();
    }

    [Fact]
    public async Task Register_DuplicateUsername_ShouldReturn409()
    {
        // Arrange
        string username = $"dupuser-{Guid.NewGuid():N}"[..20];
        await _client.PostAsJsonAsync("/api/username/register", new RegisterRequest(username));

        // Act
        var response = await _client.PostAsJsonAsync("/api/username/register", new RegisterRequest(username));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Theory]
    [InlineData("ab")]           // too short (2 chars)
    [InlineData("xy")]           // too short (2 chars)
    public async Task CheckUsername_TooShort_ShouldReturn400(string username)
    {
        var response = await _client.GetAsync($"/api/username/check/{username}");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CheckUsername_EmptyPath_ShouldReturn404()
    {
        // Empty name doesn't match the route pattern → 404 from routing, not 400 from handler
        var response = await _client.GetAsync("/api/username/check/");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Stats_ShouldReturnFilterInfo()
    {
        var response = await _client.GetAsync("/api/username/stats");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
