using System;
using UnityEngine;
using ArrowGo.Backend;

namespace ArrowGo.Gameplay
{
    public enum GameMode
    {
        Endless,
        LevelBased
    }

    [System.Serializable]
    public struct LevelData
    {
        public int levelNumber;
        public float trackLength;          // Distance in meters to the finish line
        public int targetRingsToCollect;    // Rings objective
        public float baseObstacleSpeed;     // For moving obstacles
        public float obstacleDensity;       // Spawn frequency multiplier
    }

    /// <summary>
    /// Manages Game Modes (Endless vs Level-Based), level goals, finish line portals,
    /// and syncs unlocked levels locally and to Supabase.
    /// </summary>
    public class LevelManager : MonoBehaviour
    {
        public static LevelManager Instance { get; private set; }

        private const string PREF_CURRENT_LEVEL = "User_Current_Level";
        private const string PREF_MAX_UNLOCKED = "User_Max_Unlocked_Level";

        [Header("Mode Configuration")]
        [SerializeField] private GameMode currentMode = GameMode.Endless;

        [Header("Level Progress")]
        [SerializeField] private int currentLevel = 1;
        [SerializeField] private int maxUnlockedLevel = 1;

        [Header("Finish Line Reference")]
        [SerializeField] private GameObject finishPortalPrefab;

        private GameObject _activeFinishPortal;
        private int _ringsCollectedInLevel = 0;

        public GameMode CurrentMode => currentMode;
        public int CurrentLevel => currentLevel;
        public int MaxUnlockedLevel => maxUnlockedLevel;

        public event Action<int, int> OnRingsProgressUpdated; // current, target
        public event Action<int, int> OnLevelCompleted;        // level, stars (1-3)

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            LoadLevelProgress();
        }

        private void LoadLevelProgress()
        {
            currentLevel = PlayerPrefs.GetInt(PREF_CURRENT_LEVEL, 1);
            maxUnlockedLevel = PlayerPrefs.GetInt(PREF_MAX_UNLOCKED, 1);
        }

        public void SetGameMode(GameMode mode)
        {
            currentMode = mode;
        }

        public void SelectLevel(int level)
        {
            currentLevel = Mathf.Clamp(level, 1, maxUnlockedLevel);
            PlayerPrefs.SetInt(PREF_CURRENT_LEVEL, currentLevel);
            PlayerPrefs.Save();
        }

        public LevelData GetCurrentLevelData()
        {
            return new LevelData
            {
                levelNumber = currentLevel,
                trackLength = 80f + (currentLevel * 25f),              // e.g. Level 1: 105m, Level 5: 205m
                targetRingsToCollect = 5 + (currentLevel * 2),        // Level 1: 7 rings, Level 5: 15 rings
                baseObstacleSpeed = Mathf.Min(1.5f + (currentLevel * 0.4f), 5f),
                obstacleDensity = 1f + (currentLevel * 0.15f)
            };
        }

        public void SetupLevel(float startY)
        {
            _ringsCollectedInLevel = 0;

            if (currentMode == GameMode.LevelBased)
            {
                LevelData data = GetCurrentLevelData();
                float finishY = startY + data.trackLength;

                // Spawn or reposition finish line portal
                if (_activeFinishPortal == null && finishPortalPrefab != null)
                {
                    _activeFinishPortal = Instantiate(finishPortalPrefab);
                }

                if (_activeFinishPortal != null)
                {
                    _activeFinishPortal.transform.position = new Vector3(0f, finishY, 0f);
                    _activeFinishPortal.SetActive(true);
                }

                OnRingsProgressUpdated?.Invoke(0, data.targetRingsToCollect);
            }
            else
            {
                if (_activeFinishPortal != null) _activeFinishPortal.SetActive(false);
            }
        }

        public void RecordRingCollected()
        {
            if (currentMode != GameMode.LevelBased) return;

            _ringsCollectedInLevel++;
            LevelData data = GetCurrentLevelData();
            OnRingsProgressUpdated?.Invoke(_ringsCollectedInLevel, data.targetRingsToCollect);
        }

        public void TriggerFinishLineCrossed()
        {
            if (currentMode != GameMode.LevelBased) return;

            LevelData data = GetCurrentLevelData();
            int stars = 1;
            if (_ringsCollectedInLevel >= data.targetRingsToCollect) stars = 3;
            else if (_ringsCollectedInLevel >= data.targetRingsToCollect / 2) stars = 2;

            // Unlock next level
            if (currentLevel >= maxUnlockedLevel)
            {
                maxUnlockedLevel = currentLevel + 1;
                PlayerPrefs.SetInt(PREF_MAX_UNLOCKED, maxUnlockedLevel);
            }

            currentLevel++;
            PlayerPrefs.SetInt(PREF_CURRENT_LEVEL, currentLevel);
            PlayerPrefs.Save();

            // Sync level progress to Supabase
            SyncLevelToCloud(currentLevel);

            OnLevelCompleted?.Invoke(currentLevel - 1, stars);
        }

        private async void SyncLevelToCloud(int newLevel)
        {
            if (SupabaseManager.Instance != null && SupabaseManager.Instance.IsInitialized)
            {
                var profile = SupabaseManager.Instance.CurrentProfile;
                if (profile != null)
                {
                    profile.CurrentLevel = newLevel;
                    await SupabaseManager.Instance.SyncCurrentLevelAsync(newLevel);
                }
            }
        }
    }
}
