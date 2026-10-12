using UnityEngine;
using System;
using ArrowGo.Audio;

namespace ArrowGo.Gameplay
{
    /// <summary>
    /// Controls the flight physics, touch-based steering, aerodynamics, and collisions of the Arrow.
    /// </summary>
    [RequireComponent(typeof(Rigidbody2D))]
    public class ArrowController : MonoBehaviour
    {
        [Header("Flight Dynamics")]
        [Tooltip("Standard forward speed")]
        [SerializeField] private float forwardSpeed = 15f;

        [Tooltip("Max speed reachable during boosts")]
        [SerializeField] private float maxSpeed = 26f;

        [Tooltip("Steering sensitivity for touch drag")]
        [SerializeField] private float steeringSensitivity = 0.5f;

        [Tooltip("Smooth time for aerodynamic rotation alignment")]
        [SerializeField] private float rotationSmoothTime = 0.08f;

        [Header("Touch & Drag Controls")]
        [SerializeField] private float touchDeadZone = 5f;
        [SerializeField] private float maxDragDistance = 160f;

        [Header("Visual Effects")]
        [SerializeField] private TrailRenderer trailRenderer;
        [SerializeField] private ParticleSystem impactParticlePrefab;

        private Rigidbody2D _rb;
        private Vector2 _touchStartPos;
        private Vector2 _currentTouchOffset;
        private bool _isDragging;
        private float _currentVelocityZ;
        private float _currentSpeed;
        private bool _isAlive = true;

        public event Action<int> OnScoreGained;
        public event Action OnArrowCrashed;

        public float CurrentSpeed => _currentSpeed;
        public bool IsAlive => _isAlive;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _rb.gravityScale = 0f;
            _rb.interpolation = RigidbodyInterpolation2D.Interpolate;
            _rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            _currentSpeed = forwardSpeed;
        }

        private void Update()
        {
            if (!_isAlive) return;
            HandleInput();
        }

        private void FixedUpdate()
        {
            if (!_isAlive) return;
            ApplyMovementAndAerodynamics();
        }

        /// <summary>
        /// Reads touchscreen or mouse drag offsets.
        /// </summary>
        private void HandleInput()
        {
            if (Input.GetMouseButtonDown(0))
            {
                _touchStartPos = Input.mousePosition;
                _isDragging = true;
            }
            else if (Input.GetMouseButton(0) && _isDragging)
            {
                Vector2 currentPos = Input.mousePosition;
                Vector2 delta = currentPos - _touchStartPos;

                if (delta.magnitude > touchDeadZone)
                {
                    _currentTouchOffset = Vector2.ClampMagnitude(delta, maxDragDistance) / maxDragDistance;
                }
                else
                {
                    _currentTouchOffset = Vector2.zero;
                }
            }
            else if (Input.GetMouseButtonUp(0))
            {
                _isDragging = false;
                _currentTouchOffset = Vector2.zero;
            }
        }

        /// <summary>
        /// Moves arrow forward and rotates tip smoothly in direction of velocity.
        /// </summary>
        private void ApplyMovementAndAerodynamics()
        {
            float horizontalForce = _currentTouchOffset.x * steeringSensitivity * 22f;
            Vector2 targetVelocity = new Vector2(horizontalForce, _currentSpeed);
            _rb.linearVelocity = targetVelocity;

            if (_rb.linearVelocity.sqrMagnitude > 0.01f)
            {
                float targetAngle = Mathf.Atan2(_rb.linearVelocity.y, _rb.linearVelocity.x) * Mathf.Rad2Deg - 90f;
                float smoothAngle = Mathf.SmoothDampAngle(_rb.rotation, targetAngle, ref _currentVelocityZ, rotationSmoothTime);
                _rb.rotation = smoothAngle;
            }
        }

        /// <summary>
        /// Temporarily increases arrow speed.
        /// </summary>
        public void ApplySpeedBoost(float multiplier, float duration)
        {
            _currentSpeed = Mathf.Min(forwardSpeed * multiplier, maxSpeed);
            CancelInvoke(nameof(ResetSpeed));
            Invoke(nameof(ResetSpeed), duration);
        }

        private void ResetSpeed()
        {
            _currentSpeed = forwardSpeed;
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!_isAlive) return;

            if (other.CompareTag("TargetRing"))
            {
                OnScoreGained?.Invoke(10);
                SpawnParticleFX(other.transform.position);
                other.gameObject.SetActive(false); // Can be recycled by object pool

                SoundManager.Instance?.PlayRingPass();
                LevelManager.Instance?.RecordRingCollected();
            }
            else if (other.CompareTag("SpeedBoost"))
            {
                ApplySpeedBoost(1.5f, 2.5f);
                other.gameObject.SetActive(false);
                SoundManager.Instance?.PlaySpeedBoost();
            }
            else if (other.CompareTag("FinishPortal"))
            {
                // Level completion trigger
                SoundManager.Instance?.PlayLevelComplete();
                LevelManager.Instance?.TriggerFinishLineCrossed();
            }
            else if (other.CompareTag("Obstacle"))
            {
                Crash();
            }
        }

        private void OnCollisionEnter2D(Collision2D collision)
        {
            if (!_isAlive) return;

            if (collision.collider.CompareTag("Obstacle") || collision.collider.CompareTag("Wall"))
            {
                Crash();
            }
        }

        private void Crash()
        {
            _isAlive = false;
            _rb.linearVelocity = Vector2.zero;
            _rb.isKinematic = true;

            SoundManager.Instance?.PlayCrash();
            SpawnParticleFX(transform.position);
            OnArrowCrashed?.Invoke();
        }

        private void SpawnParticleFX(Vector3 position)
        {
            if (impactParticlePrefab != null)
            {
                var ps = Instantiate(impactParticlePrefab, position, Quaternion.identity);
                Destroy(ps.gameObject, 2f);
            }
        }

        public void ResetArrow(Vector3 spawnPosition)
        {
            _isAlive = true;
            _rb.isKinematic = false;
            _rb.linearVelocity = Vector2.zero;
            transform.position = spawnPosition;
            transform.rotation = Quaternion.identity;
            _currentSpeed = forwardSpeed;
            if (trailRenderer != null) trailRenderer.Clear();
        }
    }
}
