using System;
using Newtonsoft.Json;

namespace ArrowGo.Backend
{
    /// <summary>
    /// Represents the player profile stored in Supabase's 'arrow_profiles' table.
    /// Serialized cleanly with Newtonsoft.Json or Unity JsonUtility.
    /// </summary>
    [System.Serializable]
    public class PlayerProfile
    {
        [JsonProperty("id")]
        public string id;

        [JsonProperty("username")]
        public string username;

        [JsonProperty("high_score")]
        public int high_score;

        [JsonProperty("xp")]
        public int xp;

        [JsonProperty("elo_rating")]
        public int elo_rating;

        [JsonProperty("rank_tier")]
        public string rank_tier;

        [JsonProperty("arrow_color_hex")]
        public string arrow_color_hex;

        [JsonProperty("games_played")]
        public int games_played;

        [JsonProperty("wins")]
        public int wins;

        [JsonProperty("current_level")]
        public int current_level;

        [JsonProperty("updated_at")]
        public string updated_at;

        // Convenient C# Property accessors matching existing game code
        [JsonIgnore] public string Id { get => id; set => id = value; }
        [JsonIgnore] public string Username { get => username; set => username = value; }
        [JsonIgnore] public int HighScore { get => high_score; set => high_score = value; }
        [JsonIgnore] public int XP { get => xp; set => xp = value; }
        [JsonIgnore] public int EloRating { get => elo_rating; set => elo_rating = value; }
        [JsonIgnore] public string RankTier { get => rank_tier ?? "Bronze"; set => rank_tier = value; }
        [JsonIgnore] public string ArrowColorHex { get => arrow_color_hex ?? "#00FFCC"; set => arrow_color_hex = value; }
        [JsonIgnore] public int GamesPlayed { get => games_played; set => games_played = value; }
        [JsonIgnore] public int Wins { get => wins; set => wins = value; }
        [JsonIgnore] public int CurrentLevel { get => current_level; set => current_level = value; }
        [JsonIgnore] public DateTime UpdatedAt 
        { 
            get => DateTime.TryParse(updated_at, out var dt) ? dt : DateTime.UtcNow; 
            set => updated_at = value.ToString("o"); 
        }
    }

    public enum RankTierType
    {
        Bronze,
        Silver,
        Gold,
        Diamond,
        Champion
    }
}
