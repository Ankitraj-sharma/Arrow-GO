using System.Text.Json.Serialization;

namespace ArrowGo.Web.Models;

public class LevelResponse
{
    [JsonPropertyName("tier")]
    public string Tier { get; set; } = "easy";

    [JsonPropertyName("levelNumber")]
    public int LevelNumber { get; set; } = 1;

    [JsonPropertyName("width")]
    public int Width { get; set; } = 12;

    [JsonPropertyName("height")]
    public int Height { get; set; } = 12;

    [JsonPropertyName("arrowCount")]
    public int ArrowCount { get; set; } = 10;

    [JsonPropertyName("levelData")]
    public string LevelData { get; set; } = string.Empty;
}

public class ScoreSubmitRequest
{
    [JsonPropertyName("tier")]
    public string Tier { get; set; } = "easy";

    [JsonPropertyName("levelNumber")]
    public int LevelNumber { get; set; } = 1;

    [JsonPropertyName("score")]
    public int Score { get; set; } = 0;

    [JsonPropertyName("moves")]
    public int Moves { get; set; } = 0;

    [JsonPropertyName("userId")]
    public string? UserId { get; set; }

    [JsonPropertyName("username")]
    public string? Username { get; set; }
}

public class LeaderboardEntry
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("username")]
    public string? Username { get; set; }

    [JsonPropertyName("total_score")]
    public int TotalScore { get; set; }

    [JsonPropertyName("highest_level")]
    public int HighestLevel { get; set; }

    [JsonPropertyName("tier")]
    public string? Tier { get; set; }
}
