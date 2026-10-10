using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ArrowGo.Gameplay;
using ArrowGo.Customization;

namespace ArrowGo.UI
{
    /// <summary>
    /// Controls the HUD, Main Menu, and Game Over popups.
    /// </summary>
    public class HUDController : MonoBehaviour
    {
        [Header("Screens")]
        [SerializeField] private GameObject mainMenuPanel;
        [SerializeField] private GameObject inGameHUD;
        [SerializeField] private GameObject gameOverPanel;
        [SerializeField] private LeaderboardUI leaderboardUI;
        [SerializeField] private GameObject customizationPanel;

        [Header("In-Game Elements")]
        [SerializeField] private TMP_Text scoreText;

        [Header("Game Over Elements")]
        [SerializeField] private TMP_Text finalScoreText;
        [SerializeField] private Button restartButton;
        [SerializeField] private Button gameOverLeaderboardButton;

        [Header("Main Menu Elements")]
        [SerializeField] private Button playButton;
        [SerializeField] private Button leaderboardButton;
        [SerializeField] private Button customizationButton;
        [SerializeField] private Button closeCustomizationButton;

        private void Awake()
        {
            if (playButton != null) playButton.onClick.AddListener(OnPlayClicked);
            if (restartButton != null) restartButton.onClick.AddListener(OnPlayClicked);
            if (leaderboardButton != null) leaderboardButton.onClick.AddListener(OnLeaderboardClicked);
            if (gameOverLeaderboardButton != null) gameOverLeaderboardButton.onClick.AddListener(OnLeaderboardClicked);
            if (customizationButton != null) customizationButton.onClick.AddListener(OnCustomizationClicked);
            if (closeCustomizationButton != null) closeCustomizationButton.onClick.AddListener(() => customizationPanel.SetActive(false));
        }

        private void Start()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnStateChanged += HandleStateChanged;
                GameManager.Instance.OnScoreUpdated += HandleScoreUpdated;
            }
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnStateChanged -= HandleStateChanged;
                GameManager.Instance.OnScoreUpdated -= HandleScoreUpdated;
            }
        }

        private void OnPlayClicked()
        {
            GameManager.Instance.StartGame();
        }

        private void OnLeaderboardClicked()
        {
            if (leaderboardUI != null) leaderboardUI.Open();
        }

        private void OnCustomizationClicked()
        {
            if (customizationPanel != null) customizationPanel.SetActive(true);
        }

        private void HandleScoreUpdated(int score)
        {
            if (scoreText != null) scoreText.text = score.ToString();
            if (finalScoreText != null) finalScoreText.text = $"FINAL SCORE: {score}";
        }

        private void HandleStateChanged(GameState state)
        {
            if (mainMenuPanel != null) mainMenuPanel.SetActive(state == GameState.MainMenu);
            if (inGameHUD != null) inGameHUD.SetActive(state == GameState.Playing);
            if (gameOverPanel != null) gameOverPanel.SetActive(state == GameState.GameOver);
        }
    }
}
