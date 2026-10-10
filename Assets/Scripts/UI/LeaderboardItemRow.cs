using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace ArrowGo.UI
{
    /// <summary>
    /// UI component binding a single leaderboard entry row.
    /// </summary>
    public class LeaderboardItemRow : MonoBehaviour
    {
        [Header("UI Fields")]
        [SerializeField] private TMP_Text rankNumberText;
        [SerializeField] private TMP_Text usernameText;
        [SerializeField] private TMP_Text scoreText;
        [SerializeField] private TMP_Text eloText;
        [SerializeField] private TMP_Text tierText;
        [SerializeField] private Image tierBadge;

        public void Bind(int rank, string name, int score, string tier, int elo)
        {
            if (rankNumberText != null) rankNumberText.text = $"#{rank}";
            if (usernameText != null) usernameText.text = name;
            if (scoreText != null) scoreText.text = score.ToString("N0");
            if (eloText != null) eloText.text = $"{elo} SR";
            if (tierText != null) tierText.text = tier;

            if (tierBadge != null)
            {
                tierBadge.color = LeaderboardUI.GetRankTierColor(tier);
            }
        }
    }
}
