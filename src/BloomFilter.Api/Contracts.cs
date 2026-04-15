namespace BloomFilter.Api;

public record UsernameCheckResult(
    string Username,
    bool Available,
    string Note
);

public record RegisterRequest(string Username);

public record RegisterResponse(
    Guid Id,
    string Username,
    DateTimeOffset CreatedAt
);
