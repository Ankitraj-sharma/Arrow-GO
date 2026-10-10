using UnityEngine;

namespace ArrowGo.Gameplay
{
    /// <summary>
    /// Smooth follow camera designed for fast-paced vertical Arrow-GO flight.
    /// </summary>
    public class CameraController : MonoBehaviour
    {
        [Header("Target Tracking")]
        [SerializeField] private Transform target;
        [SerializeField] private Vector3 offset = new Vector3(0f, 3.5f, -10f);

        [Header("Smoothing Settings")]
        [SerializeField] private float smoothSpeed = 8f;
        [SerializeField] private float horizontalDamping = 0.4f;

        private void LateUpdate()
        {
            if (target == null) return;

            Vector3 desiredPosition = new Vector3(
                Mathf.Lerp(transform.position.x, target.position.x + offset.x, horizontalDamping),
                target.position.y + offset.y,
                offset.z
            );

            transform.position = Vector3.Lerp(transform.position, desiredPosition, smoothSpeed * Time.deltaTime);
        }

        public void SetTarget(Transform newTarget)
        {
            target = newTarget;
        }
    }
}
