using UnityEngine;

namespace ArrowGo.Audio
{
    /// <summary>
    /// Complete Sound & Audio Manager for Arrow-GO.
    /// Features: BGM loop, SFX channels, PlayerPrefs volume saving,
    /// and built-in Procedural Audio Synthesis (generates chimes, whooshes, crashes, and clicks)
    /// so the game has rich audio out of the box even without external audio asset files!
    /// </summary>
    public class SoundManager : MonoBehaviour
    {
        public static SoundManager Instance { get; private set; }

        private const string PREF_BGM_VOL = "Setting_BGM_Vol";
        private const string PREF_SFX_VOL = "Setting_SFX_Vol";
        private const string PREF_MUTED = "Setting_Muted";

        [Header("Audio Sources")]
        [SerializeField] private AudioSource bgmSource;
        [SerializeField] private AudioSource sfxSource;

        [Header("Audio Clips (Optional - Fallbacks to Procedural Synth)")]
        [SerializeField] private AudioClip ringPassClip;
        [SerializeField] private AudioClip speedBoostClip;
        [SerializeField] private AudioClip crashClip;
        [SerializeField] private AudioClip buttonClickClip;
        [SerializeField] private AudioClip levelCompleteClip;
        [SerializeField] private AudioClip backgroundMusicClip;

        private float _bgmVolume = 0.6f;
        private float _sfxVolume = 0.8f;
        private bool _isMuted = false;

        public bool IsMuted => _isMuted;
        public float BGMVolume => _bgmVolume;
        public float SFXVolume => _sfxVolume;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            SetupAudioSources();
            LoadAudioSettings();
            GenerateProceduralAudioClips();
        }

        private void Start()
        {
            StartBGM();
        }

        private void SetupAudioSources()
        {
            if (bgmSource == null)
            {
                bgmSource = gameObject.AddComponent<AudioSource>();
                bgmSource.loop = true;
                bgmSource.playOnAwake = false;
            }

            if (sfxSource == null)
            {
                sfxSource = gameObject.AddComponent<AudioSource>();
                sfxSource.loop = false;
                sfxSource.playOnAwake = false;
            }
        }

        private void LoadAudioSettings()
        {
            _bgmVolume = PlayerPrefs.GetFloat(PREF_BGM_VOL, 0.6f);
            _sfxVolume = PlayerPrefs.GetFloat(PREF_SFX_VOL, 0.8f);
            _isMuted = PlayerPrefs.GetInt(PREF_MUTED, 0) == 1;

            ApplyVolumes();
        }

        private void ApplyVolumes()
        {
            float muteMultiplier = _isMuted ? 0f : 1f;
            if (bgmSource != null) bgmSource.volume = _bgmVolume * muteMultiplier;
            if (sfxSource != null) sfxSource.volume = _sfxVolume * muteMultiplier;
        }

        public void ToggleMute()
        {
            _isMuted = !_isMuted;
            PlayerPrefs.SetInt(PREF_MUTED, _isMuted ? 1 : 0);
            PlayerPrefs.Save();
            ApplyVolumes();
        }

        public void SetBGMVolume(float volume)
        {
            _bgmVolume = Mathf.Clamp01(volume);
            PlayerPrefs.SetFloat(PREF_BGM_VOL, _bgmVolume);
            PlayerPrefs.Save();
            ApplyVolumes();
        }

        public void SetSFXVolume(float volume)
        {
            _sfxVolume = Mathf.Clamp01(volume);
            PlayerPrefs.SetFloat(PREF_SFX_VOL, _sfxVolume);
            PlayerPrefs.Save();
            ApplyVolumes();
        }

        public void StartBGM()
        {
            if (bgmSource == null) return;
            if (backgroundMusicClip != null)
            {
                bgmSource.clip = backgroundMusicClip;
                bgmSource.Play();
            }
        }

        public void PlayRingPass() => PlaySound(ringPassClip, 0.9f);
        public void PlaySpeedBoost() => PlaySound(speedBoostClip, 1.0f);
        public void PlayCrash() => PlaySound(crashClip, 1.0f);
        public void PlayButtonClick() => PlaySound(buttonClickClip, 0.7f);
        public void PlayLevelComplete() => PlaySound(levelCompleteClip, 1.0f);

        private void PlaySound(AudioClip clip, float volumeScale = 1.0f)
        {
            if (_isMuted || sfxSource == null || clip == null) return;
            sfxSource.PlayOneShot(clip, volumeScale * _sfxVolume);
        }

        /// <summary>
        /// Generates procedural audio waveforms in memory so sound works immediately!
        /// </summary>
        private void GenerateProceduralAudioClips()
        {
            if (ringPassClip == null) ringPassClip = CreateChimeSound(600f, 1300f, 0.22f);
            if (speedBoostClip == null) speedBoostClip = CreateBoostSound(250f, 750f, 0.45f);
            if (crashClip == null) crashClip = CreateNoiseCrashSound(0.5f);
            if (buttonClickClip == null) buttonClickClip = CreateClickSound(950f, 0.05f);
            if (levelCompleteClip == null) levelCompleteClip = CreateFanfareSound();
            if (backgroundMusicClip == null) backgroundMusicClip = CreateAmbientMusicLoop(4.0f);
        }

        private AudioClip CreateChimeSound(float startFreq, float endFreq, float duration)
        {
            int sampleRate = 44100;
            int totalSamples = (int)(sampleRate * duration);
            float[] samples = new float[totalSamples];

            for (int i = 0; i < totalSamples; i++)
            {
                float t = (float)i / totalSamples;
                float currentFreq = Mathf.Lerp(startFreq, endFreq, t);
                float envelope = Mathf.Sin(t * Mathf.PI); // Smooth attack & decay
                samples[i] = Mathf.Sin(2f * Mathf.PI * currentFreq * (i / (float)sampleRate)) * envelope * 0.8f;
            }

            AudioClip clip = AudioClip.Create("Synth_RingPass", totalSamples, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        private AudioClip CreateBoostSound(float startFreq, float endFreq, float duration)
        {
            int sampleRate = 44100;
            int totalSamples = (int)(sampleRate * duration);
            float[] samples = new float[totalSamples];

            for (int i = 0; i < totalSamples; i++)
            {
                float t = (float)i / totalSamples;
                float freq = Mathf.Lerp(startFreq, endFreq, Mathf.Pow(t, 2f));
                float envelope = 1f - t;
                samples[i] = Mathf.Sin(2f * Mathf.PI * freq * (i / (float)sampleRate)) * envelope * 0.7f;
            }

            AudioClip clip = AudioClip.Create("Synth_Boost", totalSamples, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        private AudioClip CreateNoiseCrashSound(float duration)
        {
            int sampleRate = 44100;
            int totalSamples = (int)(sampleRate * duration);
            float[] samples = new float[totalSamples];

            for (int i = 0; i < totalSamples; i++)
            {
                float t = (float)i / totalSamples;
                float noise = (Random.value * 2f - 1f);
                float lowPunch = Mathf.Sin(2f * Mathf.PI * (120f * (1f - t)) * (i / (float)sampleRate));
                float envelope = Mathf.Exp(-4f * t);
                samples[i] = (noise * 0.6f + lowPunch * 0.4f) * envelope;
            }

            AudioClip clip = AudioClip.Create("Synth_Crash", totalSamples, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        private AudioClip CreateClickSound(float freq, float duration)
        {
            int sampleRate = 44100;
            int totalSamples = (int)(sampleRate * duration);
            float[] samples = new float[totalSamples];

            for (int i = 0; i < totalSamples; i++)
            {
                float t = (float)i / totalSamples;
                samples[i] = Mathf.Sin(2f * Mathf.PI * freq * (i / (float)sampleRate)) * (1f - t) * 0.5f;
            }

            AudioClip clip = AudioClip.Create("Synth_Click", totalSamples, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        private AudioClip CreateFanfareSound()
        {
            float duration = 1.2f;
            int sampleRate = 44100;
            int totalSamples = (int)(sampleRate * duration);
            float[] samples = new float[totalSamples];
            float[] notes = { 523.25f, 659.25f, 783.99f, 1046.50f }; // C5, E5, G5, C6

            for (int i = 0; i < totalSamples; i++)
            {
                float t = (float)i / totalSamples;
                int noteIndex = Mathf.Min((int)(t * 4), 3);
                float noteFreq = notes[noteIndex];
                float envelope = Mathf.Sin((t * 4 - noteIndex) * Mathf.PI);
                samples[i] = Mathf.Sin(2f * Mathf.PI * noteFreq * (i / (float)sampleRate)) * Mathf.Max(0, envelope) * 0.7f;
            }

            AudioClip clip = AudioClip.Create("Synth_Fanfare", totalSamples, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        private AudioClip CreateAmbientMusicLoop(float duration)
        {
            int sampleRate = 22050; // Lightweight for BGM
            int totalSamples = (int)(sampleRate * duration);
            float[] samples = new float[totalSamples];

            for (int i = 0; i < totalSamples; i++)
            {
                float timeSec = (float)i / sampleRate;
                // Soft cyber pulse drone at 110Hz and 220Hz
                float drone = Mathf.Sin(2f * Mathf.PI * 110f * timeSec) * 0.15f;
                float overtone = Mathf.Sin(2f * Mathf.PI * 220f * timeSec) * 0.08f;
                float rhythm = Mathf.Sin(2f * Mathf.PI * 2f * timeSec); // 2Hz pulse
                samples[i] = (drone + overtone) * (0.8f + 0.2f * rhythm);
            }

            AudioClip clip = AudioClip.Create("Synth_BGM", totalSamples, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }
    }
}
