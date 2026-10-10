using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using Supabase;
using Supabase.Gotrue;
using Postgrest;
using static Supabase.Postgrest.Constants;

namespace ArrowGo.Backend
{
    /// <summary>
    /// Singleton manager connecting Unity to the Supabase Cloud backend.
    /// Handles authentication, leaderboard retrieval, score submissions, and profile synchronization.
    /// </summary>
    public class SupabaseManager : MonoBehaviour
    {
        public static SupabaseManager Instance { get; private set; }

        [Header("Supabase Cloud Credentials")]
        [Tooltip("Your Supabase Project URL")]
        [SerializeField] private string supabaseUrl = "https://btuxqfkomiqbwzlgyfit.supabase.co";

        [Tooltip("Your Supabase Anon / Public Key")]
        [SerializeField] private string supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0dXhxZmtvbWlxYnd6bGd5Zml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNDY1OTgsImV4cCI6MjEwNTcyMjU5OH0.CBu7W2KCUiLf0NDcTli51zvAFiKZKkWabmQDxG4jZAc";

        private Client _client;
        public PlayerProfile CurrentProfile { get; private set; }
        public bool IsInitialized { get; private set; }

        public event Action<PlayerProfile> OnProfileLoaded;
        public event Action<string> OnErrorOccurred;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private async void Start()
        {
            await InitializeSupabaseAsync();
        }

        /// <summary>
        /// Initializes the Supabase client and signs in the guest player.
        /// </summary>
        public async Task InitializeSupabaseAsync()
        {
            try
            {
                var options = new SupabaseOptions
                {
                    AutoRefreshToken = true,
                    PersistSession = true
                };

                _client = new Client(supabaseUrl, supabaseAnonKey, options);
                await _client.InitializeAsync();

                await AuthenticateGuestUserAsync();
                IsInitialized = true;
                Debug.Log("<color=green>[Supabase] Connected to project: btuxqfkomiqbwzlgyfit</color>");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Supabase] Initialization error: {ex.Message}");
                OnErrorOccurred?.Invoke(ex.Message);
            }
        }

        /// <summary>
        /// Authenticates the user using persistent guest credentials stored in PlayerPrefs.
        /// </summary>
        private async Task AuthenticateGuestUserAsync()
        {
            string guestEmail = PlayerPrefs.GetString("arrow_guest_email", "");
            string guestPassword = PlayerPrefs.GetString("arrow_guest_pwd", "");

            if (string.IsNullOrEmpty(guestEmail))
            {
                string deviceId = SystemInfo.deviceUniqueIdentifier.Length >= 8 
                    ? SystemInfo.deviceUniqueIdentifier.Substring(0, 8) 
                    : "player";
                guestEmail = $"guest_{deviceId}_{Guid.NewGuid().ToString().Substring(0, 5)}@arrowgo.local";
                guestPassword = Guid.NewGuid().ToString("N");

                var session = await _client.Auth.SignUp(guestEmail, guestPassword);
                PlayerPrefs.SetString("arrow_guest_email", guestEmail);
                PlayerPrefs.SetString("arrow_guest_pwd", guestPassword);
                PlayerPrefs.Save();

                CurrentProfile = new PlayerProfile
                {
                    Id = session.User.Id,
                    Username = $"Archer_{UnityEngine.Random.Range(1000, 9999)}",
                    HighScore = 0,
                    XP = 0,
                    EloRating = 1000,
                    RankTier = "Bronze",
                    ArrowColorHex = "#00FFCC",
                    GamesPlayed = 0,
                    Wins = 0,
                    UpdatedAt = DateTime.UtcNow
                };

                await _client.From<PlayerProfile>().Insert(CurrentProfile);
            }
            else
            {
                var session = await _client.Auth.SignIn(guestEmail, guestPassword);
                await FetchCurrentProfileAsync(session.User.Id);
            }

            OnProfileLoaded?.Invoke(CurrentProfile);
        }

        /// <summary>
        /// Fetches the profile data for a specific user ID.
        /// </summary>
        public async Task FetchCurrentProfileAsync(string userId)
        {
            try
            {
                var response = await _client.From<PlayerProfile>()
                    .Where(p => p.Id == userId)
                    .Single();

                CurrentProfile = response;
                OnProfileLoaded?.Invoke(CurrentProfile);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Supabase] Fetch profile failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Retrieves the global top players ordered by high score.
        /// </summary>
        public async Task<List<PlayerProfile>> GetTopLeaderboardAsync(int limit = 50)
        {
            try
            {
                var response = await _client.From<PlayerProfile>()
                    .Order(p => p.HighScore, Ordering.Descending)
                    .Limit(limit)
                    .Get();

                return response.Models;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Supabase] Fetch leaderboard error: {ex.Message}");
                return new List<PlayerProfile>();
            }
        }

        /// <summary>
        /// Submits a match result and updates high score, Elo, and rank tier via PostgreSQL RPC.
        /// </summary>
        public async Task SubmitMatchResultAsync(int matchScore, bool isWin, int xpEarned)
        {
            if (CurrentProfile == null) return;

            try
            {
                var rpcParams = new Dictionary<string, object>
                {
                    { "player_id", CurrentProfile.Id },
                    { "match_score", matchScore },
                    { "is_win", isWin },
                    { "xp_earned", xpEarned }
                };

                await _client.Rpc("submit_arrow_match_result", rpcParams);
                await FetchCurrentProfileAsync(CurrentProfile.Id);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Supabase] Submit match result error: {ex.Message}");
            }
        }

        /// <summary>
        /// Syncs arrow color hex code to the cloud profile.
        /// </summary>
        public async Task SyncArrowColorAsync(string hexColor)
        {
            if (CurrentProfile == null) return;

            try
            {
                CurrentProfile.ArrowColorHex = hexColor;
                CurrentProfile.UpdatedAt = DateTime.UtcNow;

                await _client.From<PlayerProfile>()
                    .Where(p => p.Id == CurrentProfile.Id)
                    .Set(p => p.ArrowColorHex, hexColor)
                    .Update();

                Debug.Log($"[Supabase] Synced arrow color '{hexColor}' to cloud.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Supabase] Sync arrow color error: {ex.Message}");
            }
        }
    }
}
