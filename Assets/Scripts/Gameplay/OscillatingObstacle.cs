using UnityEngine;

namespace ArrowGo.Gameplay
{
    /// <summary>
    /// Adds horizontal sinusoidal oscillation to obstacles in higher levels.
    /// </summary>
    public class OscillatingObstacle : MonoBehaviour
    {
        [SerializeField] private float speed = 2.5f;
        [SerializeField] private float amplitude = 3.5f;

        private float _startX;
        private float _randomOffset;

        private void OnEnable()
        {
            _startX = transform.position.x;
            _randomOffset = Random.Range(0f, Mathf.PI * 2f);
        }

        public void SetSpeedAndAmplitude(float newSpeed, float newAmplitude)
        {
            speed = newSpeed;
            amplitude = newAmplitude;
        }

        private void Update()
        {
            float newX = _startX + Mathf.Sin((Time.time * speed) + _randomOffset) * amplitude;
            transform.position = new Vector3(newX, transform.position.y, transform.position.z);
        }
    }
}
