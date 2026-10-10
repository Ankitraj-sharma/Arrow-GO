using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using ArrowGo.Backend;

namespace ArrowGo.Customization
{
    /// <summary>
    /// Manages Arrow cosmetic customizations including material colors, trail gradients,
    /// particle system colors, local PlayerPrefs persistence, and Supabase cloud sync.
    /// </summary>
    public class CustomizationManager : MonoBehaviour
    {
        public static CustomizationManager Instance { get; private set; }

        private const string COLOR_KEY = "Arrow_Color_Hex";
        private const string DEFAULT_HEX = "#00FFCC";

        [Header("Arrow Visual Targets")]
        [SerializeField] private SpriteRenderer arrowSpriteRenderer;
        [SerializeField] private MeshRenderer arrowMeshRenderer;
        [SerializeField] private TrailRenderer arrowTrailRenderer;
        [SerializeField] private ParticleSystem arrowParticleSystem;

        [Header("Predefined Color Palette")]
        [SerializeField] private List<Color> paletteColors = new List<Color>
        {
            new Color(0.0f, 1.0f, 0.8f),  // Cyber Neon Cyan
            new Color(1.0f, 0.2f, 0.4f),  // Crimson Blaze
            new Color(1.0f, 0.84f, 0.0f), // Champion Gold
            new Color(0.6f, 0.1f, 1.0f),  // Neon Violet
            new Color(0.2f, 1.0f, 0.2f),  // Emerald Green
            new Color(1.0f, 0.5f, 0.0f),  // Solar Flare
            new Color(0.2f, 0.7f, 1.0f),  // Glacial Blue
            new Color(1.0f, 1.0f, 1.0f)   // Pure White
        };

        [Header("UI Palette Grid")]
        [SerializeField] private Transform paletteContainer;
        [SerializeField] private GameObject colorButtonPrefab;

        private MaterialPropertyBlock _propBlock;
        private static readonly int BaseColorId = Shader.PropertyToID("_Color");
        private static readonly int EmissionColorId = Shader.PropertyToID("_EmissionColor");

        public Color CurrentColor { get; private set; }
        public event Action<Color> OnColorChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            _propBlock = new MaterialPropertyBlock();
        }

        private void Start()
        {
            LoadSavedColor();
            PopulatePaletteUI();

            if (SupabaseManager.Instance != null)
            {
                SupabaseManager.Instance.OnProfileLoaded += OnCloudProfileLoaded;
            }
        }

        private void OnDestroy()
        {
            if (SupabaseManager.Instance != null)
            {
                SupabaseManager.Instance.OnProfileLoaded -= OnCloudProfileLoaded;
            }
        }

        private void LoadSavedColor()
        {
            string hex = PlayerPrefs.GetString(COLOR_KEY, DEFAULT_HEX);
            if (ColorUtility.TryParseHtmlString(hex, out Color col))
            {
                ApplyColor(col, false);
            }
            else
            {
                ApplyColor(paletteColors[0], false);
            }
        }

        private void OnCloudProfileLoaded(PlayerProfile profile)
        {
            if (profile != null && !string.IsNullOrEmpty(profile.ArrowColorHex))
            {
                if (ColorUtility.TryParseHtmlString(profile.ArrowColorHex, out Color cloudCol))
                {
                    ApplyColor(cloudCol, false);
                }
            }
        }

        /// <summary>
        /// Applies new color to Sprite/Mesh, TrailRenderer, and ParticleSystem.
        /// </summary>
        public void ApplyColor(Color newColor, bool saveAndSync = true)
        {
            CurrentColor = newColor;
            string hex = "#" + ColorUtility.ToHtmlStringRGB(newColor);

            // 1. SpriteRenderer (2D mode)
            if (arrowSpriteRenderer != null)
            {
                arrowSpriteRenderer.color = newColor;
            }

            // 2. MeshRenderer (3D mode) - Using MaterialPropertyBlock for zero garbage
            if (arrowMeshRenderer != null)
            {
                arrowMeshRenderer.GetPropertyBlock(_propBlock);
                _propBlock.SetColor(BaseColorId, newColor);
                _propBlock.SetColor(EmissionColorId, newColor * 1.4f);
                arrowMeshRenderer.SetPropertyBlock(_propBlock);
            }

            // 3. TrailRenderer
            if (arrowTrailRenderer != null)
            {
                Gradient grad = new Gradient();
                grad.SetKeys(
                    new GradientColorKey[] { new GradientColorKey(newColor, 0.0f), new GradientColorKey(Color.white, 1.0f) },
                    new GradientAlphaKey[] { new GradientAlphaKey(0.85f, 0.0f), new GradientAlphaKey(0.0f, 1.0f) }
                );
                arrowTrailRenderer.colorGradient = grad;
            }

            // 4. ParticleSystem
            if (arrowParticleSystem != null)
            {
                var main = arrowParticleSystem.main;
                main.startColor = new ParticleSystem.MinMaxGradient(newColor);
            }

            OnColorChanged?.Invoke(newColor);

            // 5. Persistence & Cloud Sync
            if (saveAndSync)
            {
                PlayerPrefs.SetString(COLOR_KEY, hex);
                PlayerPrefs.Save();

                if (SupabaseManager.Instance != null && SupabaseManager.Instance.IsInitialized)
                {
                    _ = SupabaseManager.Instance.SyncArrowColorAsync(hex);
                }
            }
        }

        private void PopulatePaletteUI()
        {
            if (paletteContainer == null || colorButtonPrefab == null) return;

            foreach (var col in paletteColors)
            {
                GameObject btnObj = Instantiate(colorButtonPrefab, paletteContainer);
                Image img = btnObj.GetComponent<Image>();
                Button btn = btnObj.GetComponent<Button>();

                if (img != null) img.color = col;
                if (btn != null)
                {
                    Color captured = col;
                    btn.onClick.AddListener(() => ApplyColor(captured, true));
                }
            }
        }
    }
}
