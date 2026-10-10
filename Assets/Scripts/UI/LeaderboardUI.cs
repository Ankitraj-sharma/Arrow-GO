using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ArrowGo.Backend;

namespace ArrowGo.UI
{
    /// <summary>
    /// Controls the Leaderboard screen, populates rows from Supabase, and updates local player statistics.
    /// </summary>
    public class LeaderboardUI : MonoBehaviour
    {
        [Header("Leaderboard Panel")]
        [SerializeField] private GameObject leaderboardPanel;
        [SerializeField] private Transform contentContainer;
        [SerializeField] private GameObject leaderboardRowPrefab;
        [SerializeField] private Button refreshButton;
        [SerializeField] private Button closeButton;
        [SerializeField] private TMP_Text statusText;

        [Header("Local Player Header Card")]
        [SerializeField] private TMP_Text localUsernameText;
        [SerializeField] private TMP_Text localRankText;
        [SerializeField] private TMP_Text localEloText;
        [SerializeField] private TMP_Text localHighScoreText;
        [SerializeField] private Image localRankBadge;

        private void Awake()
        {
            if (refreshButton != null) refreshButton.onClick.AddListener(OnRefreshClicked);
            if (closeButton != null) closeButton.onClick.AddListener(Close);
        }

        public void Open()
        {
            if (leaderboardPanel != null) leaderboardPanel.SetActive(true);
            UpdateLocalPlayerCard();
            _ = LoadLeaderboardDataAsync();
        }

        public void Close()
        {
            if (leaderboardPanel != null) leaderboardPanel.SetActive(false);
        }

        private async void OnRefreshClicked()
        {
            await LoadLeaderboardDataAsync();
        }

        private void UpdateLocalPlayerCard()
        {
            var profile = SupabaseManager.Instance?.CurrentProfile;
            if (profile == null) return;

            if (localUsernameText != null) localUsernameText.text = profile.Username;
            if (localRankText != null) localRankText.text = $"Tier: {profile.RankTier}";
            if (localEloText != null) localEloText.text = $"{profile.EloRating} SR";
            if (localHighScoreText != null) localHighScoreText.text = $"High: {profile.HighScore:N0}";

            if (localRankBadge != null)
            {
                localRankBadge.color = GetRankTierColor(profile.RankTier);
            }
        }

        private async Task LoadLeaderboardDataAsync()
        {
            if (statusText != null)
            {
                statusText.text = "Loading Global Rankings...";
                statusText.gameObject.SetActive(true);
            }

            // Clear previous items
            if (contentContainer != null)
            {
                foreach (Transform child in contentContainer)
                {
                    Destroy(child.gameObject);
                }
            }

            List<PlayerProfile> topPlayers = await SupabaseManager.Instance.GetTopLeaderboardAsync(50);

            if (statusText != null) statusText.gameObject.SetActive(false);

            if (topPlayers == null || topPlayers.Count == 0)
            {
                if (statusText != null)
                {
                    statusText.text = "No records found.";
                    statusText.gameObject.SetActive(true);
                }
                return;
            }

            for (int i = 0; i < topPlayers.Count; i++)
            {
                var p = topPlayers[i];
                if (leaderboardRowPrefab != null && contentContainer != null)
                {
                    GameObject row = Instantiate(leaderboardRowPrefab, contentContainer);
                    var rowComp = row.GetComponent<LeaderboardItemRow>();
                    if (rowComp != null)
                    {
                        rowComp.Bind(i + 1, p.Username, p.HighScore, p.RankTier, p.EloRating);
                    }
                }
            }
        }

        public static Color GetRankTierColor(string tier)
        {
            return tier switch
            {
                "Champion" => new Color(1.0f, 0.25f, 0.25f), // Crimson Red
                "Diamond"  => new Color(0.2f, 0.85f, 1.0f),  // Ice Blue
                "Gold"     => new Color(1.0f, 0.84f, 0.0f),  // Radiant Gold
                "Silver"   => new Color(0.75f, 0.75f, 0.8f), // Polished Silver
                _          => new Color(0.8f, 0.5f, 0.2f)    // Bronze
            };
        }
    }
}
