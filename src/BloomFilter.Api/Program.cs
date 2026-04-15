using System.Text.RegularExpressions;
using BloomFilter.Api;
using BloomFilter.Api.Data;
using BloomFilter.Api.DataStructures;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// --- Services ---

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseInMemoryDatabase("BloomFilterDb"));

builder.Services.AddSingleton(sp =>
{
    int expectedItems = builder.Configuration.GetValue("BloomFilter:ExpectedItems", 1_000_000);
    double fpRate = builder.Configuration.GetValue("BloomFilter:FalsePositiveRate", 0.01);

    var filter = new BloomFilter<string>(expectedItems, fpRate);

    using var scope = sp.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Seed DB with example usernames on first run (InMemory DB is empty on startup).
    // Keeps parity with demo/bloom-filter-demo.jsx so the student sees meaningful
    // state in /stats and the Bloom Filter has bits set from the beginning.
    if (!db.Users.Any())
    {
        string[] seed =
        [
            "pedro", "maria", "carlos", "admin", "root", "test", "user",
            "developer", "garcia", "lopez", "martinez", "fernandez", "gonzalez",
            "rodriguez", "sanchez", "perez", "gomez", "ruiz", "diaz", "moreno",
            "alvarez", "munoz", "romero", "navarro", "torres", "dominguez",
            "vazquez", "ramos", "gil", "serrano", "blanco", "molina", "morales",
            "suarez", "ortega", "delgado", "castro", "ortiz", "rubio", "marin"
        ];
        db.Users.AddRange(seed.Select(u => new User { Username = u }));
        db.SaveChanges();
    }

    foreach (string username in db.Users.Select(u => u.Username))
    {
        filter.Add(username.ToLowerInvariant());
    }

    return filter;
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// OpenAPI spec generation (used by Scalar UI in Development)
builder.Services.AddOpenApi();

// --- App ---

var app = builder.Build();

app.UseCors();

// Interactive API documentation (Scalar UI) — dev-only for safety.
// Spec: /openapi/v1.json   UI: /scalar/v1
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("Bloom Filter API");
    });
}

app.MapGet("/", () => "Bloom Filter API is running");

// --- Username endpoints ---

var usernameApi = app.MapGroup("/api/username");

// Pre-check rápido (solo Bloom Filter, no toca DB)
usernameApi.MapGet("/check/{name}", (string name, BloomFilter<string> filter) =>
{
    string normalized = name.Trim().ToLowerInvariant();

    if (normalized.Length < 3 || normalized.Length > 50)
    {
        return Results.BadRequest(new
        {
            type = "https://tools.ietf.org/html/rfc9457",
            title = "Username inválido",
            status = 400,
            detail = "El username debe tener entre 3 y 50 caracteres"
        });
    }

    if (!Regex.IsMatch(normalized, @"^[a-z0-9\-]+$"))
    {
        return Results.BadRequest(new
        {
            type = "https://tools.ietf.org/html/rfc9457",
            title = "Username inválido",
            status = 400,
            detail = "Solo caracteres alfanuméricos y guiones"
        });
    }

    bool probablyTaken = filter.ProbablyContains(normalized);

    return Results.Ok(new UsernameCheckResult(
        Username: normalized,
        Available: !probablyTaken,
        Note: probablyTaken
            ? "Probablemente ocupado — confirmar con registro"
            : "Disponible — el filtro garantiza que no existe"
    ));
})
.WithTags("Username")
.WithName("CheckUsername")
.Produces<UsernameCheckResult>(StatusCodes.Status200OK)
.ProducesProblem(StatusCodes.Status400BadRequest);

// Registro real (DB + actualización del filtro)
usernameApi.MapPost("/register", async (
    RegisterRequest request,
    BloomFilter<string> filter,
    AppDbContext db) =>
{
    string normalized = request.Username.Trim().ToLowerInvariant();

    if (normalized.Length < 3 || normalized.Length > 50)
    {
        return Results.BadRequest(new
        {
            type = "https://tools.ietf.org/html/rfc9457",
            title = "Username inválido",
            status = 400,
            detail = "El username debe tener entre 3 y 50 caracteres"
        });
    }

    if (!Regex.IsMatch(normalized, @"^[a-z0-9\-]+$"))
    {
        return Results.BadRequest(new
        {
            type = "https://tools.ietf.org/html/rfc9457",
            title = "Username inválido",
            status = 400,
            detail = "Solo caracteres alfanuméricos y guiones"
        });
    }

    // Pre-check con Bloom Filter
    if (filter.ProbablyContains(normalized))
    {
        bool existsInDb = await db.Users.AnyAsync(u => u.Username == normalized);
        if (existsInDb)
        {
            return Results.Conflict(new
            {
                type = "https://tools.ietf.org/html/rfc9457",
                title = "Username no disponible",
                status = 409,
                detail = $"'{normalized}' ya está registrado"
            });
        }
        // Falso positivo del filtro — continuar con registro
    }

    var user = new User { Username = normalized };
    db.Users.Add(user);

    try
    {
        await db.SaveChangesAsync();
        filter.Add(normalized);

        return Results.Created(
            $"/api/username/{normalized}",
            new RegisterResponse(user.Id, user.Username, user.CreatedAt)
        );
    }
    catch (DbUpdateException)
    {
        return Results.Conflict(new
        {
            type = "https://tools.ietf.org/html/rfc9457",
            title = "Username no disponible",
            status = 409,
            detail = "Registrado por otro usuario simultáneamente"
        });
    }
})
.WithTags("Username")
.WithName("RegisterUsername")
.Produces<RegisterResponse>(StatusCodes.Status201Created)
.ProducesProblem(StatusCodes.Status400BadRequest)
.ProducesProblem(StatusCodes.Status409Conflict);

// Lista de usernames registrados (para panel de verificación visual en la UI)
usernameApi.MapGet("/list", async (AppDbContext db) =>
{
    var users = await db.Users
        .OrderBy(u => u.CreatedAt)
        .Take(200)
        .Select(u => new UsernameListItem(u.Username, u.CreatedAt))
        .ToListAsync();

    return Results.Ok(users);
})
.WithTags("Username")
.WithName("ListUsernames")
.Produces<List<UsernameListItem>>(StatusCodes.Status200OK);

// Stats del filtro (debug/demo) — incluye bitsSample para visualización
usernameApi.MapGet("/stats", (BloomFilter<string> filter) =>
{
    double fillRatio = 1.0 - Math.Pow(1.0 - 1.0 / filter.Size, (double)filter.HashCount * filter.Count);
    double fpRate = Math.Pow(fillRatio, filter.HashCount);

    return Results.Ok(new
    {
        totalItems = filter.Count,
        filterSizeBits = filter.Size,
        hashFunctions = filter.HashCount,
        estimatedFillRatio = Math.Round(fillRatio, 6),
        estimatedFalsePositiveRate = Math.Round(fpRate, 8),
        memorySizeBytes = filter.Size / 8,
        bitsSample = filter.GetBitsSample(256)
    });
})
.WithTags("Filter")
.WithName("GetStats");

// Visualización pedagógica — posiciones de los hashes para un username
usernameApi.MapGet("/visualize/{name}", (string name, BloomFilter<string> filter) =>
{
    string normalized = name.Trim().ToLowerInvariant();

    if (normalized.Length < 3 || normalized.Length > 50)
    {
        return Results.BadRequest(new
        {
            type = "https://tools.ietf.org/html/rfc9457",
            title = "Username inválido",
            status = 400,
            detail = "El username debe tener entre 3 y 50 caracteres"
        });
    }

    int[] positions = filter.GetPositionsFor(normalized);
    return Results.Ok(new
    {
        username = normalized,
        positions
    });
})
.WithTags("Filter")
.WithName("VisualizeUsername")
.ProducesProblem(StatusCodes.Status400BadRequest);

app.Run();

// Make Program accessible for WebApplicationFactory in tests
public partial class Program { }
