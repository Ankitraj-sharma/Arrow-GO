using System;
using System.Collections.Generic;
using System.Linq;

namespace ArrowGo.Web.Services;

public class LabyrinthGeneratorService
{
    private static readonly (int dx, int dy, int dir)[] Dirs = new[]
    {
        (0, -1, 0), // UP
        (1, 0, 1),  // RIGHT
        (0, 1, 2),  // DOWN
        (-1, 0, 3)  // LEFT
    };

    private static readonly Dictionary<string, List<string>> CuratedLevels = new(StringComparer.OrdinalIgnoreCase);

    static LabyrinthGeneratorService()
    {
        // 1. Intro Level (Exact 12x12 level from arrowsgo.io)
        var intro = "12;12;13,14,15,16,17,18,19,20,21,22|130,118,106,94,82,70,58,46,34|121,122,123,124,125,126,127,128,129|50,51,52,53,54,42,41|43,55,56,68,69|92,91,90,102,101|100,88,87,75,74|76,77,65|79,78,66|103,115,114";

        // Prepopulate tiers
        CuratedLevels["easy"] = new List<string> { intro };
        for (int i = 2; i <= 10; i++)
        {
            int sz = 12 + (i > 5 ? 2 : 0);
            int target = 10 + i;
            CuratedLevels["easy"].Add(GenerateSolvableLevel(sz, sz, target, 5, 14));
        }

        CuratedLevels["medium"] = new List<string>();
        for (int i = 1; i <= 10; i++)
        {
            int sz = 18 + i;
            int target = 22 + i * 2;
            CuratedLevels["medium"].Add(GenerateSolvableLevel(sz, sz, target, 6, 18));
        }

        CuratedLevels["hard"] = new List<string>();
        for (int i = 1; i <= 10; i++)
        {
            int sz = 28 + (i % 4) * 2;
            int target = 40 + i * 3;
            CuratedLevels["hard"].Add(GenerateSolvableLevel(sz, sz, target, 7, 22));
        }

        CuratedLevels["complex"] = new List<string>();
        for (int i = 1; i <= 10; i++)
        {
            int sz = 38 + (i % 3) * 4;
            int target = 65 + i * 4;
            CuratedLevels["complex"].Add(GenerateSolvableLevel(sz, sz, target, 8, 26));
        }
    }

    private static readonly Dictionary<string, string> GeneratedCache = new(StringComparer.OrdinalIgnoreCase);

    public string GetLevel(string tier, int levelNum)
    {
        var key = tier?.ToLowerInvariant() ?? "easy";
        int clampedLevel = Math.Clamp(levelNum, 1, 50);
        string cacheKey = $"{key}_{clampedLevel}";

        lock (GeneratedCache)
        {
            if (GeneratedCache.TryGetValue(cacheKey, out var cached))
                return cached;
        }

        if (CuratedLevels.TryGetValue(key, out var list))
        {
            int index = clampedLevel - 1;
            if (index < list.Count)
            {
                lock (GeneratedCache) GeneratedCache[cacheKey] = list[index];
                return list[index];
            }
        }

        // Progressive difficulty scaling for levels up to 50
        double progress = (clampedLevel - 1) / 49.0;
        int width, target, minL, maxL;

        if (key == "easy")
        {
            width = (int)Math.Round(12 + progress * 8);       // 12 -> 20
            target = (int)Math.Round(10 + progress * 26);     // 10 -> 36
            minL = (int)Math.Round(4 + progress * 2);         // 4 -> 6
            maxL = (int)Math.Round(10 + progress * 8);        // 10 -> 18
        }
        else if (key == "medium")
        {
            width = (int)Math.Round(18 + progress * 12);      // 18 -> 30
            target = (int)Math.Round(20 + progress * 38);     // 20 -> 58
            minL = (int)Math.Round(5 + progress * 3);         // 5 -> 8
            maxL = (int)Math.Round(14 + progress * 10);       // 14 -> 24
        }
        else if (key == "hard")
        {
            width = (int)Math.Round(26 + progress * 14);      // 26 -> 40
            target = (int)Math.Round(35 + progress * 50);     // 35 -> 85
            minL = (int)Math.Round(6 + progress * 3);         // 6 -> 9
            maxL = (int)Math.Round(18 + progress * 10);       // 18 -> 28
        }
        else // complex
        {
            width = (int)Math.Round(34 + progress * 16);      // 34 -> 50
            target = (int)Math.Round(50 + progress * 70);     // 50 -> 120
            minL = (int)Math.Round(7 + progress * 3);         // 7 -> 10
            maxL = (int)Math.Round(22 + progress * 10);       // 22 -> 32
        }

        var generated = GenerateSolvableLevel(width, width, target, minL, maxL);
        lock (GeneratedCache) GeneratedCache[cacheKey] = generated;
        return generated;
    }

    public static string GenerateSolvableLevel(int width, int height, int targetArrows, int minLen = 5, int maxLen = 18)
    {
        var rand = Random.Shared;

        for (int attempt = 0; attempt < 80; attempt++)
        {
            int[,] grid = new int[height, width];
            List<List<(int x, int y)>> arrows = new();

            bool CanRunOut(int headX, int headY, int dir)
            {
                if (dir == 0) // UP
                {
                    for (int y = headY - 1; y >= 0; y--) if (grid[y, headX] > 0) return false;
                    return true;
                }
                if (dir == 1) // RIGHT
                {
                    for (int x = headX + 1; x < width; x++) if (grid[headY, x] > 0) return false;
                    return true;
                }
                if (dir == 2) // DOWN
                {
                    for (int y = headY + 1; y < height; y++) if (grid[y, headX] > 0) return false;
                    return true;
                }
                if (dir == 3) // LEFT
                {
                    for (int x = headX - 1; x >= 0; x--) if (grid[headY, x] > 0) return false;
                    return true;
                }
                return false;
            }

            int subAttempts = 0;
            while (arrows.Count < targetArrows && subAttempts < 2500)
            {
                subAttempts++;
                int headX = rand.Next(width);
                int headY = rand.Next(height);
                if (grid[headY, headX] > 0) continue;

                var validDirs = Dirs.Where(d => CanRunOut(headX, headY, d.dir)).ToArray();
                if (validDirs.Length == 0) continue;
                var chosenDir = validDirs[rand.Next(validDirs.Length)];

                var path = new List<(int x, int y)> { (headX, headY) };
                int curX = headX - chosenDir.dx;
                int curY = headY - chosenDir.dy;

                if (curX < 0 || curX >= width || curY < 0 || curY >= height || grid[curY, curX] > 0) continue;
                path.Insert(0, (curX, curY));

                int desiredLen = rand.Next(minLen, maxLen + 1);
                var curDir = chosenDir;
                int straightRun = 1;

                while (path.Count < desiredLen)
                {
                    var tail = path[0];
                    var possibleSteps = new List<((int x, int y) pt, (int dx, int dy, int dir) d, bool isStraight)>();

                    foreach (var d in Dirs)
                    {
                        if (d.dx == -curDir.dx && d.dy == -curDir.dy) continue; // no 180 reverse
                        int nx = tail.x - d.dx;
                        int ny = tail.y - d.dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny, nx] == 0)
                        {
                            if (!path.Any(p => p.x == nx && p.y == ny))
                            {
                                bool inExitRay = false;
                                if (chosenDir.dir == 0 && nx == headX && ny < headY) inExitRay = true;
                                if (chosenDir.dir == 1 && ny == headY && nx > headX) inExitRay = true;
                                if (chosenDir.dir == 2 && nx == headX && ny > headY) inExitRay = true;
                                if (chosenDir.dir == 3 && ny == headY && nx < headX) inExitRay = true;

                                if (!inExitRay)
                                {
                                    possibleSteps.Add(((nx, ny), d, d.dir == curDir.dir));
                                }
                            }
                        }
                    }

                    if (possibleSteps.Count == 0) break;

                    var straightStep = possibleSteps.FirstOrDefault(s => s.isStraight);
                    var nextStep = straightStep;

                    if (straightRun < 2 && straightStep.pt != default)
                    {
                        nextStep = straightStep;
                    }
                    else if (straightStep.pt != default && rand.NextDouble() < 0.60)
                    {
                        nextStep = straightStep;
                    }
                    else
                    {
                        var turns = possibleSteps.Where(s => !s.isStraight).ToList();
                        nextStep = turns.Count > 0 ? turns[rand.Next(turns.Count)] : straightStep;
                    }

                    if (nextStep.pt == default) break;

                    if (nextStep.isStraight) straightRun++;
                    else straightRun = 1;

                    path.Insert(0, nextStep.pt);
                    curDir = nextStep.d;
                }

                if (path.Count >= Math.Max(3, minLen - 1))
                {
                    int arrowId = arrows.Count + 1;
                    foreach (var pt in path) grid[pt.y, pt.x] = arrowId;
                    arrows.Add(path);
                }
            }

            if (arrows.Count >= Math.Max(4, (int)(targetArrows * 0.7)))
            {
                arrows.Reverse();
                var arrowStrings = arrows.Select(p => string.Join(",", p.Select(pt => pt.y * width + pt.x)));
                return $"{width};{height};{string.Join("|", arrowStrings)}";
            }
        }

        // Fallback simple level
        return "12;12;13,14,15,16,17,18,19,20,21,22|130,118,106,94,82,70,58,46,34|121,122,123,124,125,126,127,128,129|50,51,52,53,54,42,41|43,55,56,68,69|92,91,90,102,101|100,88,87,75,74|76,77,65|79,78,66|103,115,114";
    }
}
