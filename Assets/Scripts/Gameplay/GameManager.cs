using System;
using UnityEngine;
using ArrowGo.Backend;

namespace ArrowGo.Gameplay
{
    public enum GameState
    {
        MainMenu,
        Playing,
        GameOver
    }

    /// <summary>
    /// Coordinates game loop, state transitions, scoring, and cloud match result submission.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Scene References")]
        [SerializeField] private ArrowController arrow;
        [SerializeField] private ObstacleSpawner spawner;

        [Header("Game State")]
        private GameState _currentState = GameState.MainMenu;
        private int _currentScore = 0;

        public GameState CurrentState => _currentState;
        public int CurrentScore => _currentScore;

        public event Action<GameState> OnStateChanged;
        public event Action<int> OnScoreUpdated;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            if (arrow != null)
            {
                arrow.OnScoreGained += HandleScoreGained;
                arrow.OnArrowCrashed += HandleArrowCrashed;
            }

            SetState(GameState.MainMenu);
        }

        private void OnDestroy()
        {
            if (arrow != null)
            {
                arrow.OnScoreGained -= HandleScoreGained;
                arrow.OnArrowCrashed -= HandleArrowCrashed;
            }
        }

        public void StartGame()
        {
            _currentScore = 0;
            OnScoreUpdated?.Invoke(_currentScore);

            if (spawner != null) spawner.ResetTrack();
            if (arrow != null) arrow.ResetArrow(Vector3.zero);

            SetState(GameState.Playing);
        }

        private void HandleScoreGained(int points)
        {
            if (_currentState != GameState.Playing) return;

            _currentScore += points;
            OnScoreUpdated?.Invoke(_currentScore);
        }

        private async void HandleArrowCrashed()
        {
            SetState(GameState.GameOver);

            // Calculate match result
            bool isWin = _currentScore >= 50; // Win threshold
            int xpEarned = _currentScore * 2;

            Debug.Log($"<color=yellow>[GameManager] Game Over! Score: {_currentScore}, Win: {isWin}, XP: {xpEarned}</color>");

            // Push result to Supabase
            if (SupabaseManager.Instance != null && SupabaseManager.Instance.IsInitialized)
            {
                await SupabaseManager.Instance.SubmitMatchResultAsync(_currentScore, isWin, xpEarned);
            }
        }

        public void SetState(GameState newState)
        {
            _currentState = newState;
            OnStateChanged?.Invoke(_currentState);
        }
    }
}
