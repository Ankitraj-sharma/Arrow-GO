using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using Newtonsoft.Json;

namespace ArrowGo.Backend
{
    /// <summary>
    /// Singleton manager connecting Unity directly to the Supabase Cloud backend via native REST API (UnityWebRequest).
    /// Works out-of-the-box with zero third-party DLLs or NuGet dependencies.
    /// Handles guest profiles, leaderboard retrieval, score submissions, and color/level synchronization.
    /// </summary>
    public class SupabaseManager : MonoBehaviour
    {
        public static SupabaseManager Instance { get; private set; }

        [Header("Supabase Cloud Credentials")]
        [Tooltip("Your Supabase Project URL")]
        [SerializeField] private string supabaseUrl = "https://btuxqfkomiqbwzlgyfit.supabase.co";

        [Tooltip("Your Supabase Anon / Public Key")]
        [SerializeField] private string supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0dXhxZmtvbWlxYnd6bGd5Zml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNDY1OTgsImV4cCI6MjEwNTcyMjU5OH0.CBu7W2KCUiLf0NDcTli51zvAFiKZKkWabmQDxG4jZAc";

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
        /// Initializes local player credentials and syncs with Supabase.
        /// </summary>
        public async Task InitializeSupabaseAsync()
        {
            try
            {
                string playerId = PlayerPrefs.GetString("arrow_player_id", "");
                string username = PlayerPrefs.GetString("arrow_player_username", "");

                if (string.IsNullOrEmpty(playerId))
                {
                    playerId = Guid.NewGuid().ToString();
                    username = $"Archer_{UnityEngine.Random.Range(1000, 9999)}";
                    PlayerPrefs.SetString("arrow_player_id", playerId);
                    PlayerPrefs.SetString("arrow_player_username", username);
                    PlayerPrefs.Save();
                }

                await FetchOrCreateProfileAsync(playerId, username);
                IsInitialized = true;
                Debug.Log("<color=green>[Supabase] Connected to project: btuxqfkomiqbwzlgyfit</color>");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Supabase] Initialization error: {ex.Message}");
                OnErrorOccurred?.Invoke(ex.Message);
            }
        }

        private async Task FetchOrCreateProfileAsync(string playerId, string defaultUsername)
        {
            string url = $"{supabaseUrl}/rest/v1/arrow_profiles?id=eq.{playerId}&select=*";
            string json = await GetJsonAsync(url);

            var profiles = JsonConvert.DeserializeObject<List<PlayerProfile>>(json);
            if (profiles != null && profiles.Count > 0)
            {
                CurrentProfile = profiles[0];
            }
            else
            {
                // Create initial profile in cloud
                var newProfile = new PlayerProfile
                {
                    id = playerId,
                    username = defaultUsername,
                    high_score = 0,
                    xp = 0,
                    elo_rating = 1000,
                    rank_tier = "Bronze",
                    arrow_color_hex = "#00FFCC",
                    games_played = 0,
                    wins = 0,
                    current_level = 1,
                    updated_at = DateTime.UtcNow.ToString("o")
                };

                string insertUrl = $"{supabaseUrl}/rest/v1/arrow_profiles";
                string payload = JsonConvert.SerializeObject(newProfile);
                await PostJsonAsync(insertUrl, payload, returnRepresentation: true);

                CurrentProfile = newProfile;
            }

            OnProfileLoaded?.Invoke(CurrentProfile);
        }

        /// <summary>
        /// Refetches the profile for the given user ID.
        /// </summary>
        public async Task FetchCurrentProfileAsync(string userId)
        {
            try
            {
                string url = $"{supabaseUrl}/rest/v1/arrow_profiles?id=eq.{userId}&select=*";
                string json = await GetJsonAsync(url);
                var profiles = JsonConvert.DeserializeObject<List<PlayerProfile>>(json);
                if (profiles != null && profiles.Count > 0)
                {
                    CurrentProfile = profiles[0];
                    OnProfileLoaded?.Invoke(CurrentProfile);
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Supabase] Fetch profile failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Retrieves the global leaderboard ordered by high score.
        /// </summary>
        public async Task<List<PlayerProfile>> GetTopLeaderboardAsync(int limit = 50)
        {
            try
            {
                string url = $"{supabaseUrl}/rest/v1/arrow_profiles?select=*&order=high_score.desc&limit={limit}";
                string json = await GetJsonAsync(url);
                var list = JsonConvert.DeserializeObject<List<PlayerProfile>>(json);
                return list ?? new List<PlayerProfile>();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Supabase] Fetch leaderboard error: {ex.Message}");
                return new List<PlayerProfile>();
            }
        }

        /// <summary>
        /// Submits match outcome and recalculates Elo/rank tier via PostgreSQL RPC function.
        /// </summary>
        public async Task SubmitMatchResultAsync(int matchScore, bool isWin, int xpEarned)
        {
            if (CurrentProfile == null) return;

            try
            {
                string rpcUrl = $"{supabaseUrl}/rest/v1/rpc/submit_arrow_match_result";
                var rpcData = new Dictionary<string, object>
                {
                    { "player_id", CurrentProfile.Id },
                    { "match_score", matchScore },
                    { "is_win", isWin },
                    { "xp_earned", xpEarned }
                };

                string payload = JsonConvert.SerializeObject(rpcData);
                await PostJsonAsync(rpcUrl, payload);
                await FetchCurrentProfileAsync(CurrentProfile.Id);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Supabase] Submit match result error: {ex.Message}");
            }
        }

        /// <summary>
        /// Syncs arrow customization color hex code to the cloud.
        /// </summary>
        public async Task SyncArrowColorAsync(string hexColor)
        {
            if (CurrentProfile == null) return;

            try
            {
                CurrentProfile.ArrowColorHex = hexColor;
                string url = $"{supabaseUrl}/rest/v1/arrow_profiles?id=eq.{CurrentProfile.Id}";
                var payload = JsonConvert.SerializeObject(new Dictionary<string, string>
                {
                    { "arrow_color_hex", hexColor },
                    { "updated_at", DateTime.UtcNow.ToString("o") }
                });

                await PatchJsonAsync(url, payload);
                Debug.Log($"[Supabase] Synced arrow color '{hexColor}' to cloud.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Supabase] Sync arrow color error: {ex.Message}");
            }
        }

        /// <summary>
        /// Syncs campaign level progression to Supabase.
        /// </summary>
        public async Task SyncCurrentLevelAsync(int level)
        {
            if (CurrentProfile == null) return;

            try
            {
                CurrentProfile.CurrentLevel = level;
                string url = $"{supabaseUrl}/rest/v1/arrow_profiles?id=eq.{CurrentProfile.Id}";
                var payload = JsonConvert.SerializeObject(new Dictionary<string, object>
                {
                    { "current_level", level },
                    { "updated_at", DateTime.UtcNow.ToString("o") }
                });

                await PatchJsonAsync(url, payload);
                Debug.Log($"[Supabase] Synced level {level} to cloud.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Supabase] Sync level error: {ex.Message}");
            }
        }

        #region HTTP REST Client Helpers

        private void ApplySupabaseHeaders(UnityWebRequest req)
        {
            req.SetRequestHeader("apikey", supabaseAnonKey);
            req.SetRequestHeader("Authorization", $"Bearer {supabaseAnonKey}");
        }

        private async Task<string> GetJsonAsync(string url)
        {
            using var req = UnityWebRequest.Get(url);
            ApplySupabaseHeaders(req);
            req.SetRequestHeader("Accept", "application/json");

            await SendWebRequestAsync(req);

            if (req.result != UnityWebRequest.Result.Success)
            {
                throw new Exception($"HTTP GET {req.responseCode}: {req.error} | {req.downloadHandler.text}");
            }

            return req.downloadHandler.text;
        }

        private async Task<string> PostJsonAsync(string url, string jsonBody, bool returnRepresentation = false)
        {
            using var req = new UnityWebRequest(url, "POST");
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
            req.uploadHandler = new UploadHandlerRaw(bodyRaw);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Content-Type", "application/json");
            ApplySupabaseHeaders(req);

            if (returnRepresentation)
            {
                req.SetRequestHeader("Prefer", "return=representation");
            }

            await SendWebRequestAsync(req);

            if (req.result != UnityWebRequest.Result.Success)
            {
                throw new Exception($"HTTP POST {req.responseCode}: {req.error} | {req.downloadHandler.text}");
            }

            return req.downloadHandler.text;
        }

        private async Task<string> PatchJsonAsync(string url, string jsonBody)
        {
            using var req = new UnityWebRequest(url, "PATCH");
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
            req.uploadHandler = new UploadHandlerRaw(bodyRaw);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Content-Type", "application/json");
            ApplySupabaseHeaders(req);

            await SendWebRequestAsync(req);

            if (req.result != UnityWebRequest.Result.Success)
            {
                throw new Exception($"HTTP PATCH {req.responseCode}: {req.error} | {req.downloadHandler.text}");
            }

            return req.downloadHandler.text;
        }

        private Task<UnityWebRequest> SendWebRequestAsync(UnityWebRequest req)
        {
            var tcs = new TaskCompletionSource<UnityWebRequest>();
            var op = req.SendWebRequest();
            op.completed += _ => tcs.SetResult(req);
            return tcs.Task;
        }

        #endregion
    }
}
