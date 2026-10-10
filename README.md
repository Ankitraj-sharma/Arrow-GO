# 🏹 Arrow-GO — Hyper-Casual Mobile Game

A complete, production-grade 2D/3D hyper-casual mobile game inspired by **"Arrow-GO"**, developed using **Unity (C#)** and powered by **Supabase (PostgreSQL)** for the cloud backend.

---

## 🌟 Key Features

1. **Core Physics & Mechanics (`ArrowController.cs`)**:
   - Smooth touch/swipe-based drag trajectory steering.
   - Forward propulsion with aerodynamic rotational damping along velocity vector.
   - Continuous collision detection with Target Rings, Speed Boosters, and Obstacles.
2. **Dual Game Modes (`LevelManager.cs`)**:
   - **Endless Mode**: High-speed endless flight, procedural rings, obstacle dodging, and chasing the global high score.
   - **Level-Based Mode**: Level objectives (rings quota), finish line portal, increasing obstacle densities, moving obstacles (`OscillatingObstacle.cs`), star rating (1-3 stars), and next level unlocking.
3. **Sound System & Procedural SFX (`SoundManager.cs`)**:
   - Audio channels for BGM loop and SFX.
   - Built-in **Procedural Audio Synthesis**: Generates harmonic chimes, speed boosts, white-noise crash crunches, UI clicks, and ambient cyber BGM in memory out of the box without requiring external .wav/.mp3 downloads!
   - PlayerPrefs volume saving & mute toggle button.
4. **Procedural 3D Cyber Arrow Mesh (`ProceduralArrowMesh.cs`)**:
   - Generates a sleek, aerodynamic low-poly 3D arrow mesh at runtime: sharp supersonic nosecone, faceted fuselage, 3 stabilizer delta fins, and rear energy thruster nozzle.
   - Completely standalone—no external 3D Blender / .FBX files required.
5. **Advanced Arrow Customization (`CustomizationManager.cs`)**:
   - Multi-color palette support.
   - Zero-garbage runtime material adjustment via `MaterialPropertyBlock`.
   - Dynamic real-time gradient update for `TrailRenderer` and start color for `ParticleSystem`.
   - Local `PlayerPrefs` cache + asynchronous cloud sync to Supabase.
6. **Global Leaderboard & Elo Ranking (`SupabaseManager.cs` & `LeaderboardUI.cs`)**:
   - Real-time global high scores from Supabase PostgreSQL table `public.arrow_profiles`.
   - Dynamic competitive tier system: **Bronze**, **Silver**, **Gold**, **Diamond**, and **Champion**.
   - Atomic win/loss rating calculation powered by the PostgreSQL stored procedure `submit_arrow_match_result`.

---

## 🗄️ Supabase Cloud Configuration

- **Project URL**: `https://btuxqfkomiqbwzlgyfit.supabase.co`
- **Target Table**: `public.arrow_profiles`
- **Stored Procedure**: `public.submit_arrow_match_result(player_id, match_score, is_win, xp_earned)`
- **Row-Level Security**: Enabled with public leaderboard read and authenticated owner updates.

The database schema is located in [`sql/schema.sql`](sql/schema.sql).

---

## 📂 Project Architecture

```
Arrow-GO/
├── Assets/
│   ├── Packages.config               # Preconfigured NuGet packages for Supabase
│   └── Scripts/
│       ├── Audio/
│       │   └── SoundManager.cs        # BGM, SFX & Procedural Audio Synthesis
│       ├── Backend/
│       │   ├── PlayerProfile.cs       # Postgrest Data Model for Supabase
│       │   └── SupabaseManager.cs     # Auth, Leaderboard & Elo Client Service
│       ├── Gameplay/
│       │   ├── ArrowController.cs     # Aerodynamic Flight & Touch Input
│       │   ├── CameraController.cs    # Smooth Follow Tracking
│       │   ├── ObstacleSpawner.cs     # Object Pooled Procedural Generation
│       │   ├── LevelManager.cs        # Endless vs Level-Based Mode & Goals
│       │   ├── OscillatingObstacle.cs # Dynamic Moving Obstacles
│       │   ├── ProceduralArrowMesh.cs # Runtime 3D Cyber Arrow Model
│       │   └── GameManager.cs         # Match Loop & Score Reporting
│       ├── Customization/
│       │   └── CustomizationManager.cs# Material, Trail & Particle Color Sync
│       └── UI/
│           ├── HUDController.cs       # Menu, Mode Selector & Audio Toggle
│           ├── LeaderboardUI.cs       # Leaderboard Screen & Local Player Card
│           └── LeaderboardItemRow.cs  # Dynamic Row Component
├── Packages/
│   └── manifest.json                  # UGUI, TextMesh Pro, Physics 2D & NuGetForUnity
├── ProjectSettings/
│   └── ProjectVersion.txt             # Unity 6 (6000.0.84f1)
├── sql/
│   └── schema.sql                     # Production SQL Schema
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

1. Open **Unity Hub** (Desktop shortcut: `Unity Hub.lnk`).
2. `Arrow-GO` is already added to your project list. Click to open with Unity 6!
3. Hit **Play (▶)** in Unity:
   - Choose **Endless Mode** or **Levels Mode**.
   - Enjoy real-time procedural audio SFX.
   - Experience the 3D procedural cyber arrow visuals.
   - Compete on the live Supabase global leaderboard!
