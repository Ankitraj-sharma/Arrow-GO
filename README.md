# 🏹 ArrowGo — Logic Puzzle Game (.NET 9.0 ASP.NET Core MVC & C#)

A high-performance, full-stack recreation of the viral **ArrowsGo** logic puzzle game (`https://arrowsgo.io`), built using **ASP.NET Core 9.0 MVC (C#)**, **HTML5 Canvas 2D**, and **Supabase (PostgreSQL)**.

---

## 🚀 Quick Start (Run in 10 Seconds)

### Option 1: Command Line (.NET SDK)
Make sure .NET 9 SDK is installed, then run:
```bash
cd ArrowGo.Web
dotnet run
```
Open your browser at **`http://localhost:5000`** (or the URL displayed in the terminal) to play!

### Option 2: Visual Studio / VS Code
1. Double click **`ArrowGo.sln`** to open the solution in Visual Studio 2022 / 2025.
2. Select `ArrowGo.Web` as the startup project.
3. Press **F5** or click **Run**.

---

## 🌟 Key Features & Tech Stack

### 1. ASP.NET Core 9.0 MVC Backend (C#)
- **MVC Architecture**: Clean separation of Models, Views, Controllers, and Services.
- **`LabyrinthGeneratorService.cs`**:
  - Manhattan raycasting collision detection implemented in C#.
  - Procedural backward-growth maze generation ensuring 100% solvable labyrinths.
  - Curated level pools across 4 difficulty tiers: **Easy (12×12)**, **Medium (20×20)**, **Hard (32×32)**, and **Complex (44×44)**.
- **`GameApiController.cs`**:
  - `GET /api/game/level/{tier}/{levelNumber}`: Fetches curated puzzle layouts.
  - `GET /api/game/random?tier={tier}`: Generates instant procedural levels on demand.
  - `POST /api/game/score`: Validates moves and scores on the server.
- **Razor Views**:
  - `Views/Shared/_Layout.cshtml`: Modern responsive shell, header navigation, Google Sign-In & Supabase modal dialogs.
  - `Views/Home/Index.cshtml`: Game HUD, difficulty badges, 3-heart lives tracker, move counter, and Canvas stage.

### 2. High-Performance HTML5 Canvas Frontend
- **60 FPS Physics & Animation**: Multi-segment cubic bezier curve rendering with slithering exit animations.
- **Web Audio API Synthesizer**: Procedural audio chords, blocked collision thuds, and victory chimes without external audio assets.
- **Authentic ArrowsGo Mechanics**:
  - 3 Lives (Hearts) collision penalty.
  - Undo and Hint solver algorithms.
  - Full parity with `arrowsgo.io` layout and colors.

### 3. Cloud Database & Authentication (Supabase)
- **Google OAuth & Email Login**: One-click authentication.
- **Live Leaderboards**: Real-time player Elo rating and global rankings stored in PostgreSQL `public.arrow_profiles`.

---

## 📂 Project Structure

```text
Arrow-GO/
├── ArrowGo.sln                          # Visual Studio Solution File
├── ArrowGo.Web/                         # ASP.NET Core 9.0 MVC Project
│   ├── ArrowGo.Web.csproj               # .NET 9.0 C# project configuration
│   ├── Program.cs                       # DI container, Kestrel pipeline & routing
│   ├── Controllers/
│   │   ├── HomeController.cs            # Razor MVC Page Controller
│   │   └── GameApiController.cs         # REST API for Levels & Score Validation
│   ├── Models/
│   │   └── ArrowGameModels.cs           # C# DTOs (LevelResponse, ScoreRequest, Leaderboard)
│   ├── Services/
│   │   └── LabyrinthGeneratorService.cs # C# Procedural Maze & Solvability Engine
│   ├── Views/
│   │   ├── Shared/_Layout.cshtml        # Main Shell, Modals & Global Scripts
│   │   └── Home/Index.cshtml            # Game Canvas Stage & HUD
│   └── wwwroot/
│       ├── css/style.css                # Dark-mode styling matching arrowsgo.io
│       └── js/
│           ├── game.js                  # Canvas 2D engine & Web Audio synthesizer
│           ├── levels.js                # Level definitions & client generator
│           └── supabase.js              # Supabase Cloud Auth & Leaderboard API
├── sql/
│   └── schema.sql                       # PostgreSQL Leaderboard Schema & Stored Procedures
├── index.html                           # Standalone static version (if running without .NET)
├── style.css
├── game.js
├── levels.js
├── supabase.js
└── README.md
```

---

## 🌐 Supabase Cloud Configuration

- **Project URL**: `https://btuxqfkomiqbwzlgyfit.supabase.co`
- **Table**: `public.arrow_profiles`
- **SQL Schema**: [`sql/schema.sql`](sql/schema.sql)
