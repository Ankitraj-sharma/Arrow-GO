using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ArrowGo.Gameplay;
using ArrowGo.Customization;
using ArrowGo.Audio;

namespace ArrowGo.UI
{
    /// <summary>
    /// Comprehensive HUD and UI Screen controller.
    /// Manages Main Menu, Endless/Level Mode selection, Sound settings,
    /// In-Game HUD objective tracker, Game Over, and Level Won screens.
    /// </summary>
    public class HUDController : MonoBehaviour
    {
        [Header("Screens")]
        [SerializeField] private GameObject mainMenuPanel;
        [SerializeField] private GameObject inGameHUD;
        [SerializeField] private GameObject gameOverPanel;
        [SerializeField] private GameObject levelWonPanel;
        [SerializeField] private LeaderboardUI leaderboardUI;
        [SerializeField] private GameObject customizationPanel;

        [Header("In-Game HUD Elements")]
        [SerializeField] private TMP_Text scoreText;
        [SerializeField] private TMP_Text levelObjectiveText;

        [Header("Level Won Screen")]
        [SerializeField] private TMP_Text levelWonTitleText;
        [SerializeField] private TMP_Text levelStarsText;
        [SerializeField] private Button nextLevelButton;

        [Header("Game Over Elements")]
        [SerializeField] private TMP_Text finalScoreText;
        [SerializeField] private Button restartButton;
        [SerializeField] private Button gameOverLeaderboardButton;

        [Header("Main Menu Elements")]
        [SerializeField] private Button playEndlessButton;
        [SerializeField] private Button playLevelsButton;
        [SerializeField] private Button leaderboardButton;
        [SerializeField] private Button customizationButton;
        [SerializeField] private Button closeCustomizationButton;
        [SerializeField] private Button soundToggleButton;
        [SerializeField] private TMP_Text soundToggleText;
        [SerializeField] private TMP_Text currentLevelBadgeText;

        private void Awake()
        {
            // Buttons
            if (playEndlessButton != null) playEndlessButton.onClick.AddListener(() => StartWithMode(GameMode.Endless));
            if (playLevelsButton != null) playLevelsButton.onClick.AddListener(() => StartWithMode(GameMode.LevelBased));
            if (restartButton != null) restartButton.onClick.AddListener(OnRestartClicked);
            if (nextLevelButton != null) nextLevelButton.onClick.AddListener(OnNextLevelClicked);
            if (leaderboardButton != null) leaderboardButton.onClick.AddListener(OnLeaderboardClicked);
            if (gameOverLeaderboardButton != null) gameOverLeaderboardButton.onClick.AddListener(OnLeaderboardClicked);
            if (customizationButton != null) customizationButton.onClick.AddListener(OnCustomizationClicked);
            if (closeCustomizationButton != null) closeCustomizationButton.onClick.AddListener(() => customizationPanel.SetActive(false));
            if (soundToggleButton != null) soundToggleButton.onClick.AddListener(OnSoundToggleClicked);
        }

        private void Start()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnStateChanged += HandleStateChanged;
                GameManager.Instance.OnScoreUpdated += HandleScoreUpdated;
            }

            if (LevelManager.Instance != null)
            {
                LevelManager.Instance.OnRingsProgressUpdated += HandleRingProgress;
                LevelManager.Instance.OnLevelCompleted += HandleLevelCompletedUI;
                UpdateCurrentLevelBadge();
            }

            UpdateSoundButtonText();
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnStateChanged -= HandleStateChanged;
                GameManager.Instance.OnScoreUpdated -= HandleScoreUpdated;
            }

            if (LevelManager.Instance != null)
            {
                LevelManager.Instance.OnRingsProgressUpdated -= HandleRingProgress;
                LevelManager.Instance.OnLevelCompleted -= HandleLevelCompletedUI;
            }
        }

        private void StartWithMode(GameMode mode)
        {
            SoundManager.Instance?.PlayButtonClick();
            LevelManager.Instance?.SetGameMode(mode);

            if (levelObjectiveText != null)
            {
                levelObjectiveText.gameObject.SetActive(mode == GameMode.LevelBased);
            }

            GameManager.Instance.StartGame();
        }

        private void OnRestartClicked()
        {
            SoundManager.Instance?.PlayButtonClick();
            GameManager.Instance.StartGame();
        }

        private void OnNextLevelClicked()
        {
            SoundManager.Instance?.PlayButtonClick();
            UpdateCurrentLevelBadge();
            StartWithMode(GameMode.LevelBased);
        }

        private void OnLeaderboardClicked()
        {
            SoundManager.Instance?.PlayButtonClick();
            if (leaderboardUI != null) leaderboardUI.Open();
        }

        private void OnCustomizationClicked()
        {
            SoundManager.Instance?.PlayButtonClick();
            if (customizationPanel != null) customizationPanel.SetActive(true);
        }

        private void OnSoundToggleClicked()
        {
            SoundManager.Instance?.ToggleMute();
            SoundManager.Instance?.PlayButtonClick();
            UpdateSoundButtonText();
        }

        private void UpdateSoundButtonText()
        {
            if (soundToggleText != null)
            {
                bool isMuted = SoundManager.Instance != null && SoundManager.Instance.IsMuted;
                soundToggleText.text = isMuted ? "SOUND: OFF" : "SOUND: ON";
            }
        }

        private void UpdateCurrentLevelBadge()
        {
            if (currentLevelBadgeText != null && LevelManager.Instance != null)
            {
                currentLevelBadgeText.text = $"LEVEL {LevelManager.Instance.CurrentLevel}";
            }
        }

        private void HandleRingProgress(int current, int target)
        {
            if (levelObjectiveText != null)
            {
                levelObjectiveText.text = $"RINGS: {current} / {target}";
            }
        }

        private void HandleLevelCompletedUI(int level, int stars)
        {
            if (levelWonTitleText != null) levelWonTitleText.text = $"LEVEL {level} CLEARED!";
            if (levelStarsText != null)
            {
                string starIcons = new string('★', stars) + new string('☆', 3 - stars);
                levelStarsText.text = $"RATING: {starIcons}";
            }
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
            if (levelWonPanel != null) levelWonPanel.SetActive(state == GameState.LevelWon);
        }
    }
}
