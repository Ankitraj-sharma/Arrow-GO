using System.Collections.Generic;
using UnityEngine;

namespace ArrowGo.Gameplay
{
    /// <summary>
    /// Procedurally spawns endless rings, gates, and obstacles using an optimized Object Pool.
    /// </summary>
    public class ObstacleSpawner : MonoBehaviour
    {
        [Header("Prefabs")]
        [SerializeField] private GameObject targetRingPrefab;
        [SerializeField] private GameObject obstaclePrefab;

        [Header("Generation Parameters")]
        [SerializeField] private Transform playerTransform;
        [SerializeField] private float spawnDistanceAhead = 40f;
        [SerializeField] private float rowSpacing = 8f;
        [SerializeField] private float trackWidth = 5.5f;

        [Header("Object Pooling")]
        [SerializeField] private int initialPoolSize = 25;

        private readonly Queue<GameObject> _ringPool = new Queue<GameObject>();
        private readonly Queue<GameObject> _obstaclePool = new Queue<GameObject>();
        private readonly List<GameObject> _activeObjects = new List<GameObject>();

        private float _lastSpawnY = 5f;

        private void Start()
        {
            InitializePools();
        }

        private void Update()
        {
            if (playerTransform == null) return;

            float maxTrackY = float.MaxValue;
            if (LevelManager.Instance != null && LevelManager.Instance.CurrentMode == GameMode.LevelBased)
            {
                maxTrackY = LevelManager.Instance.GetCurrentLevelData().trackLength - 8f;
            }

            // Spawn ahead of player up to track length
            while (_lastSpawnY < playerTransform.position.y + spawnDistanceAhead && _lastSpawnY < maxTrackY)
            {
                SpawnRow(_lastSpawnY);
                _lastSpawnY += rowSpacing;
            }

            // Recycle objects that fall far behind
            RecyclePassedObjects();
        }

        private void InitializePools()
        {
            for (int i = 0; i < initialPoolSize; i++)
            {
                if (targetRingPrefab != null)
                {
                    GameObject ring = Instantiate(targetRingPrefab, transform);
                    ring.SetActive(false);
                    _ringPool.Enqueue(ring);
                }

                if (obstaclePrefab != null)
                {
                    GameObject obs = Instantiate(obstaclePrefab, transform);
                    obs.SetActive(false);
                    _obstaclePool.Enqueue(obs);
                }
            }
        }

        private void SpawnRow(float yPos)
        {
            float randomX = Random.Range(-trackWidth * 0.7f, trackWidth * 0.7f);

            // 70% chance of ring, 30% chance of obstacle
            bool isRing = Random.value > 0.3f;
            GameObject objToSpawn = isRing ? GetFromPool(_ringPool, targetRingPrefab) : GetFromPool(_obstaclePool, obstaclePrefab);

            if (objToSpawn != null)
            {
                objToSpawn.transform.position = new Vector3(randomX, yPos, 0f);
                objToSpawn.SetActive(true);
                _activeObjects.Add(objToSpawn);
            }
        }

        private GameObject GetFromPool(Queue<GameObject> pool, GameObject prefab)
        {
            if (pool.Count > 0)
            {
                return pool.Dequeue();
            }

            if (prefab != null)
            {
                return Instantiate(prefab, transform);
            }

            return null;
        }

        private void RecyclePassedObjects()
        {
            for (int i = _activeObjects.Count - 1; i >= 0; i--)
            {
                GameObject obj = _activeObjects[i];
                if (obj.transform.position.y < playerTransform.position.y - 15f)
                {
                    obj.SetActive(false);
                    _activeObjects.RemoveAt(i);

                    if (obj.CompareTag("TargetRing"))
                    {
                        _ringPool.Enqueue(obj);
                    }
                    else
                    {
                        _obstaclePool.Enqueue(obj);
                    }
                }
            }
        }

        public void ResetTrack()
        {
            foreach (var obj in _activeObjects)
            {
                obj.SetActive(false);
                if (obj.CompareTag("TargetRing")) _ringPool.Enqueue(obj);
                else _obstaclePool.Enqueue(obj);
            }
            _activeObjects.Clear();
            _lastSpawnY = 5f;
        }
    }
}
