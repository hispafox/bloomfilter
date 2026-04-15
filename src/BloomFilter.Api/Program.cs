var builder = WebApplication.CreateBuilder(args);

// Services will be added here

var app = builder.Build();

app.MapGet("/", () => "Bloom Filter API is running");

app.Run();
