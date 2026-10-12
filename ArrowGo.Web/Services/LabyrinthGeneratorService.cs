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

    public string GetLevel(string tier, int levelNum)
    {
        var key = tier?.ToLowerInvariant() ?? "easy";
        if (!CuratedLevels.TryGetValue(key, out var list))
        {
            list = CuratedLevels["easy"];
        }

        int index = Math.Max(0, levelNum - 1);
        if (index < list.Count)
        {
            return list[index];
        }

        // Procedural generation beyond 10
        int width = 16, height = 16, target = 22, minL = 6, maxL = 16;
        if (key == "easy") { width = 14; height = 14; target = 16; minL = 5; maxL = 14; }
        else if (key == "medium") { width = 24; height = 24; target = 36; minL = 7; maxL = 20; }
        else if (key == "hard") { width = 34; height = 34; target = 58; minL = 8; maxL = 24; }
        else if (key == "complex") { width = 46; height = 46; target = 90; minL = 10; maxL = 28; }

        return GenerateSolvableLevel(width, height, target, minL, maxL);
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
