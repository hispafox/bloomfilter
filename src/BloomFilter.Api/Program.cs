using BloomFilter.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseInMemoryDatabase("BloomFilterDb"));

var app = builder.Build();

app.MapGet("/", () => "Bloom Filter API is running");

// Endpoints will be added here

app.Run();
