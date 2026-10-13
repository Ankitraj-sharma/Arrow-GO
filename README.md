# 🏹 ArrowGo — Logic Puzzle Game (.NET 9.0 ASP.NET Core MVC & C#)

A high-performance, full-stack recreation of the viral **ArrowsGo** logic puzzle game (`https://arrowsgo.io`), built using **ASP.NET Core 9.0 MVC (C#)**, **HTML5 Canvas 2D**, and **Supabase (PostgreSQL)**.

🌐 **Live Game URL**: [https://ankitraj-sharma.github.io/Arrow-GO/](https://ankitraj-sharma.github.io/Arrow-GO/)  
📦 **GitHub Repository**: [https://github.com/Ankitraj-sharma/Arrow-GO.git](https://github.com/Ankitraj-sharma/Arrow-GO.git)

---

## 🚀 Quick Start (Run in 10 Seconds)

### Option 1: Direct Play via Browser (Zero Setup)
Simply open the live URL: **[https://ankitraj-sharma.github.io/Arrow-GO/](https://ankitraj-sharma.github.io/Arrow-GO/)** on any PC, laptop, or mobile browser.

### Option 2: Command Line (.NET 9 SDK)
```bash
cd ArrowGo.Web
dotnet run
```
Open your browser at **`http://localhost:5000`** or **`http://localhost:5124`** to play!

### Option 3: Visual Studio / VS Code
1. Double click **`ArrowGo.sln`** to open the solution in Visual Studio 2022 / 2025.
2. Set `ArrowGo.Web` as the startup project.
3. Press **F5** or click **Run**.

---

## 🌟 Key Features

1. **Authentic ArrowsGo Mechanics**:
   - 3 Hearts / Lives collision penalty tracker.
   - Undo, Hint, and Reset puzzle operations.
   - 4 Progressive Difficulty Tiers: **🟢 Easy**, **🟡 Medium**, **🔴 Hard**, and **🟣 Complex**.
   - 3 Modes: **Main Route** (50 Progressive Levels), **Random Play**, and **Challenge Mode**.
2. **Smooth 60 FPS HTML5 Canvas Engine**:
   - High-definition cubic bezier curves, slithering exit animations, and responsive scaling.
3. **In-Memory Web Audio Synthesizer**:
   - Zero audio lag; harmonic chimes, collision thuds, and victory fanfares generated via mathematical waveforms.
4. **Cloud Database & Live Leaderboard (Supabase)**:
   - Google OAuth 2.0 social sign-in.
   - Real-time global player rankings with Elo rating synchronization.
5. **50 Progressive Levels per Tier**:
   - Mathematical difficulty scaling from Level 1 up to Level 50 with 100% solvability guarantee.

---

## 📂 Project Structure

```text
Arrow-GO/
├── ArrowGo.sln                          # Visual Studio Solution File
├── ArrowGo.Web/                         # ASP.NET Core 9.0 MVC Project
│   ├── ArrowGo.Web.csproj               # .NET 9.0 C# project configuration
│   ├── Dockerfile                       # Multi-stage production container build
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
├── .github/workflows/
│   └── deploy.yml                       # GitHub Actions automatic Pages CI/CD
├── sql/
│   └── schema.sql                       # PostgreSQL Leaderboard Schema & Stored Procedures
├── index.html                           # Standalone static version (GitHub Pages entrypoint)
├── style.css
├── game.js
├── levels.js
├── supabase.js
└── README.md
```

---

## 🛠️ Complete Tech Stack Breakdown & Purpose (26 Technologies)

The project leverages a modern **Full-Stack Hybrid Architecture** divided into 5 major technological tiers:

### 1. Backend & Web Frameworks (ASP.NET Core & C#)
| Technology | Role & Placement | Why It Was Chosen |
| :--- | :--- | :--- |
| **C# 13** | Backend Programming Language | High performance, strict type safety, pattern matching, and modern language features. |
| **.NET 9.0 SDK** | Execution Runtime & SDK | Latest LTS/Current cross-platform runtime with top-tier throughput. |
| **ASP.NET Core MVC** | Architectural Framework | Separation of concerns (Models, Views, Controllers) for maintainable code. |
| **ASP.NET Core Web API** | `GameApiController.cs` | Provides RESTful JSON endpoints (`/api/game/level`, `/api/game/random`, `/api/game/score`). |
| **Dependency Injection** | `Program.cs` (`builder.Services`) | Loose coupling; allows singleton registration of `LabyrinthGeneratorService`. |
| **Razor View Engine** | `_Layout.cshtml`, `Index.cshtml` | Server-rendered UI shell binding backend metadata to responsive markup. |
| **Kestrel Web Server** | In-Process Web Server | Ultra-fast, lightweight asynchronous HTTP/HTTPS server powering the backend. |

### 2. Frontend & Game Engine (HTML5 / Vanilla JS)
| Technology | Role & Placement | Why It Was Chosen |
| :--- | :--- | :--- |
| **HTML5 Canvas 2D API** | `game.js` (`CanvasRenderer`) | Hardware-accelerated 60 FPS graphic rendering for multi-segment arrows and smooth slither exit animations. |
| **Modern JavaScript (ES6+)** | `game.js`, `levels.js` | Object-oriented modular client architecture without heavy framework overhead. |
| **CSS3 (Grid & Flexbox)** | `style.css` | Glassmorphism, pearlescent game board backdrop, responsive 50-level grid modal, and mobile adaptability. |
| **Web Audio API** | `game.js` (`AudioEngine`) | In-memory procedural sound synthesis (sine/triangle oscillator waves, gain envelopes) with zero external asset load times. |

### 3. Cloud Database & Authentication (Supabase / PostgreSQL)
| Technology | Role & Placement | Why It Was Chosen |
| :--- | :--- | :--- |
| **Supabase Cloud (BaaS)** | Cloud Backend | Serverless PostgreSQL database hosting and managed auth services. |
| **PostgreSQL 15+** | Relational Database | Stores user profiles, high scores, ratings, and level progress in `public.arrow_profiles`. |
| **Google OAuth 2.0** | Authentication Protocol | Frictionless, one-click social sign-in for players across devices. |
| **PL/pgSQL Functions** | `sql/schema.sql` | Atomic stored procedure (`submit_arrow_match_result`) calculating ratings and leaderboard stats securely. |
| **Row-Level Security (RLS)** | PostgreSQL Security Policies | Enforces public leaderboard reading while restricting score writes strictly to authorized owners. |
| **@supabase/supabase-js v2** | `supabase.js` Client SDK | Direct, asynchronous cloud sync between browser and PostgreSQL database. |

### 4. Computer Science Algorithms & Mathematics
| Algorithm / Math Model | Implementation | Purpose |
| :--- | :--- | :--- |
| **Manhattan Raycast Collision** | `LabyrinthGeneratorService.cs` & `game.js` | Checks 4 orthogonal directions ($\pm X, \pm Y$) along discrete integer grid cells to detect obstacles and blocked paths. |
| **Reverse Labyrinth Growth** | `GenerateSolvableLevel()` | Builds labyrinths backward starting from border exits, mathematically guaranteeing 100% solvability without deadlocks. |
| **Seeded PRNG (Mulberry32 Bitwise)** | `createSeededRandom(seed)` | Deterministic pseudorandom generator ensuring each level (1 to 50) is identical and replayable across sessions. |
| **Cubic Bezier Splines** | `drawArrowPath()` | Interpolates sharp 90-degree orthogonal grid vertices into smooth, elegant curved arrow bodies. |
| **Breadth-First Search (BFS) Solver** | `findHint()` | Explores valid move trees in real time to recommend the next unblocked move when the player requests a Hint. |

### 5. DevOps, Containerization & Hosting
| Tool / Platform | Configuration | Purpose |
| :--- | :--- | :--- |
| **Git & GitHub** | `main` & `gh-pages` | Source control, branching strategy, and code tracking. |
| **GitHub Pages** | Edge CDN Hosting | Serves the live production build at global low-latency edges for free with zero server downtime. |
| **GitHub Actions (CI/CD)** | `.github/workflows/deploy.yml` | Automated pipeline executing on every push to validate and deploy code changes. |
| **Docker Multi-Stage Build** | `ArrowGo.Web/Dockerfile` | Packages the ASP.NET Core MVC application into a lightweight runtime image for cloud hosting (Render, Railway, Azure). |
| **Unity 6 Engine (C#)** | `Assets/Scripts/` | Alternative native mobile architecture featuring touch trajectory steering and 3D procedural meshes. |

---

## 🏗️ Step-by-Step Build Journey ("Kaise Banaya Gaya")

Here is the chronological engineering progression followed to build ArrowGo from scratch:

```
[Phase 1: Reverse Engineering] ──▶ [Phase 2: Audio & Visual Engine] ──▶ [Phase 3: Cloud Database & Auth]
                                                                                      │
[Phase 6: CI/CD & Live Deploy] ◀── [Phase 5: ASP.NET Core 9 C# MVC] ◀── [Phase 4: 50-Level Progressive Scaler]
```

### Phase 1: Reverse Engineering & Core Mechanics
1. **Board Representation**: Developed a discrete 2D integer matrix where empty cells are `0` and arrow segments are mapped to `arrowId`.
2. **Manhattan Raycast Engine**: Implemented directional forward raycasting. When an arrow head attempts to move, the engine casts rays along its heading; if any cell contains an obstacle or another arrow before the boundary, the move is rejected and triggers collision feedback.
3. **Slithering Exit Animation**: Integrated multi-frame animation logic so that unblocked arrows slither out segment-by-segment and exit the board smoothly.

### Phase 2: Procedural Audio & Aesthetic Polishing
1. **Web Audio Synthesizer**: Built an in-memory oscillator engine generating harmonic chords (440Hz – 880Hz), soft UI clicks, blocked collision thuds with frequency drops, and victory fanfare chimes.
2. **Pearlescent Canvas Theme**: Matched the visual fidelity of `arrowsgo.io` with rounded corner radius, glow borders, and high-contrast color palettes (Emerald, Amber, Rose, Cyan).

### Phase 3: Cloud Database & Social Authentication
1. **PostgreSQL Schema**: Authored `sql/schema.sql` defining `public.arrow_profiles` with fields for `elo_rating`, `highest_level`, `total_score`, and `matches_played`.
2. **Supabase Cloud Sync**: Integrated Supabase Auth with Google OAuth 2.0 and email credentials. Added real-time leaderboard querying with row-level security.

### Phase 4: Solvability-Guaranteed Labyrinth Generation & 50-Level Scaling
1. **Reverse Growth Generator**: Puzzles are generated by starting from boundary exit cells and growing arrow tails inward using backwards directional step validation. This guarantees every generated maze is mathematically solvable.
2. **Deterministic Seeded PRNG**: Implemented Mulberry32 bitwise pseudorandom numbers so Level 12 or Level 45 generates the exact same layout for all players.
3. **50 Progressive Levels**: Scaled grid sizes and arrow counts progressively across 4 tiers:
   - **Easy**: $12 \times 12$ (10 arrows) $\rightarrow$ $20 \times 20$ (36 arrows)
   - **Medium**: $18 \times 18$ (20 arrows) $\rightarrow$ $30 \times 30$ (58 arrows)
   - **Hard**: $26 \times 26$ (35 arrows) $\rightarrow$ $40 \times 40$ (85 arrows)
   - **Complex**: $34 \times 34$ (50 arrows) $\rightarrow$ $50 \times 50$ (120 arrows)

### Phase 5: ASP.NET Core 9.0 MVC & C# Enterprise Architecture
1. **C# Solution (`ArrowGo.sln`)**: Created a clean ASP.NET Core 9.0 MVC web application (`ArrowGo.Web`).
2. **C# Services & API**: Ported the Manhattan raycasting and reverse maze generator to `LabyrinthGeneratorService.cs` in C#. Exposed REST endpoints via `GameApiController.cs`.
3. **Razor MVC Views**: Created `Views/Shared/_Layout.cshtml` and `Views/Home/Index.cshtml` with ASP.NET Core tag helpers and dependency injection.

### Phase 6: Automated CI/CD & Global Live Deployment
1. **GitHub Pages Deployment**: Enabled zero-cost static hosting via both `gh-pages` branch and `.github/workflows/deploy.yml`.
2. **Containerization**: Authored a production multi-stage `Dockerfile` targeting `mcr.microsoft.com/dotnet/aspnet:9.0` for container cloud hosting.
3. **Automated Packaging**: Configured automated archival generating updated distribution ZIP packages directly on the user's Desktop and Downloads folders.

---

## 🌐 Supabase Cloud Configuration

- **Project URL**: `https://rpyckuskyuahthjlrtky.supabase.co`
- **Target Table**: `public.arrow_profiles`
- **SQL Schema & Migrations**: [`sql/schema.sql`](sql/schema.sql)
- **Stored Procedure**: `public.submit_arrow_match_result(player_id, match_score, is_win, xp_earned)`
