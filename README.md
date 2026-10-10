# 🏹 Arrow-GO — Hyper-Casual Mobile Game

A complete, production-grade 2D/3D hyper-casual mobile game inspired by **"Arrow-GO"**, developed using **Unity (C#)** and powered by **Supabase (PostgreSQL)** for the cloud backend.

---

## 🌟 Key Features

1. **Core Physics & Mechanics (`ArrowController.cs`)**:
   - Smooth touch/swipe-based drag trajectory steering.
   - Forward propulsion with aerodynamic rotational damping along velocity vector.
   - Continuous collision detection with Target Rings, Speed Boosters, and Obstacles.
2. **Global Leaderboard System (`SupabaseManager.cs` & `LeaderboardUI.cs`)**:
   - Real-time global high scores fetched from Supabase PostgreSQL database table `public.arrow_profiles`.
   - Scrollable UI with dynamic ranking badges, usernames, and high scores.
3. **Elo & XP Ranking System**:
   - Dynamic competitive tier system: **Bronze**, **Silver**, **Gold**, **Diamond**, and **Champion**.
   - Atomic win/loss rating calculation powered by the PostgreSQL stored procedure `submit_arrow_match_result`.
4. **Advanced Arrow Customization (`CustomizationManager.cs`)**:
   - Dynamic multi-color support with pre-defined cyber palettes.
   - Zero-garbage runtime material color adjustment via `MaterialPropertyBlock`.
   - Real-time synchronization of `TrailRenderer` gradient and `ParticleSystem` start color.
   - Dual persistence: immediate local cache via `PlayerPrefs` + asynchronous cloud sync to Supabase.
5. **Procedural Endless Generation (`ObstacleSpawner.cs`)**:
   - Endless procedural generation with mobile-optimized Object Pooling.

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
│   └── Scripts/
│       ├── Backend/
│       │   ├── PlayerProfile.cs       # Postgrest Data Model for Supabase
│       │   └── SupabaseManager.cs     # Auth, Leaderboard & Elo Client Service
│       ├── Gameplay/
│       │   ├── ArrowController.cs     # Aerodynamic Flight & Touch Input
│       │   ├── CameraController.cs    # Smooth Follow Tracking
│       │   ├── ObstacleSpawner.cs     # Object Pooled Procedural Generation
│       │   └── GameManager.cs         # Match Loop & Score Reporting
│       ├── Customization/
│       │   └── CustomizationManager.cs# Material, Trail & Particle Color Sync
│       └── UI/
│           ├── HUDController.cs       # Game State & Screen Navigation
│           ├── LeaderboardUI.cs       # Leaderboard Screen & Local Player Card
│           └── LeaderboardItemRow.cs  # Dynamic Row Component
├── Packages/
│   └── manifest.json
├── sql/
│   └── schema.sql
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

1. Open **Unity Hub** and click **Add project from disk**.
2. Select the `Arrow-GO` directory.
3. Install the **Supabase C# SDK** (`supabase-csharp`) via **NuGetForUnity** or OpenUPM.
4. Ensure `Api Compatibility Level` in `Project Settings > Player` is set to **.NET Standard 2.1**.
5. Press **Play** in Unity: The game will automatically authenticate a persistent guest account, fetch cloud leaderboard stats, and sync arrow customizations.
