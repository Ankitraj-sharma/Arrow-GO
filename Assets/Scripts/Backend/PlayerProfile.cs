using System;
using Newtonsoft.Json;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ArrowGo.Backend
{
    /// <summary>
    /// Represents the player profile stored in Supabase's 'arrow_profiles' table.
    /// </summary>
    [Table("arrow_profiles")]
    public class PlayerProfile : BaseModel
    {
        [PrimaryKey("id", false)]
        public string Id { get; set; }

        [Column("username")]
        public string Username { get; set; }

        [Column("high_score")]
        public int HighScore { get; set; }

        [Column("xp")]
        public int XP { get; set; }

        [Column("elo_rating")]
        public int EloRating { get; set; }

        [Column("rank_tier")]
        public string RankTier { get; set; }

        [Column("arrow_color_hex")]
        public string ArrowColorHex { get; set; }

        [Column("games_played")]
        public int GamesPlayed { get; set; }

        [Column("wins")]
        public int Wins { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }
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
