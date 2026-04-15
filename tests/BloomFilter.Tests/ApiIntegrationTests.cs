using System.Net;
using System.Net.Http.Json;
using BloomFilter.Api;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
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

    [Fact]
    public async Task Stats_ShouldIncludeBitsSample()
    {
        var response = await _client.GetAsync("/api/username/stats");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var doc = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.TryGetProperty("bitsSample", out var bitsSample).Should().BeTrue();
        bitsSample.GetArrayLength().Should().Be(256);
    }

    [Fact]
    public async Task Visualize_ValidName_ShouldReturnPositions()
    {
        var response = await _client.GetAsync("/api/username/visualize/testuser");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var doc = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.TryGetProperty("positions", out var positions).Should().BeTrue();
        positions.GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Visualize_InvalidName_ShouldReturn400()
    {
        var response = await _client.GetAsync("/api/username/visualize/ab");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ListUsernames_ShouldIncludeSeededEntries()
    {
        var response = await _client.GetAsync("/api/username/list");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var items = await response.Content.ReadFromJsonAsync<List<UsernameListItem>>();

        items.Should().NotBeNull();
        items!.Should().NotBeEmpty();
        // El seed del Program.cs registra 40 usernames al arrancar.
        items.Select(i => i.Username).Should().Contain("pedro");
        items.Select(i => i.Username).Should().Contain("admin");
    }

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
}
