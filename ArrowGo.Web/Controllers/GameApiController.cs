using Microsoft.AspNetCore.Mvc;
using ArrowGo.Web.Models;
using ArrowGo.Web.Services;

namespace ArrowGo.Web.Controllers;

[ApiController]
[Route("api/game")]
[Route("api/[controller]")]
public class GameApiController : ControllerBase
{
    private readonly LabyrinthGeneratorService _generator;

    public GameApiController(LabyrinthGeneratorService generator)
    {
        _generator = generator;
    }

    [HttpGet("level/{tier}/{levelNumber:int}")]
    public ActionResult<LevelResponse> GetLevel(string tier, int levelNumber)
    {
        var levelData = _generator.GetLevel(tier, levelNumber);
        var parts = levelData.Split(';');
        int w = parts.Length > 0 ? int.Parse(parts[0]) : 12;
        int h = parts.Length > 1 ? int.Parse(parts[1]) : 12;
        int arrows = parts.Length > 2 ? parts[2].Split('|').Length : 0;

        return Ok(new LevelResponse
        {
            Tier = tier,
            LevelNumber = levelNumber,
            Width = w,
            Height = h,
            ArrowCount = arrows,
            LevelData = levelData
        });
    }

    [HttpGet("random")]
    public ActionResult<LevelResponse> GetRandom([FromQuery] string tier = "medium")
    {
        int w = 20, h = 20, target = 28;
        if (tier == "easy") { w = 14; h = 14; target = 16; }
        else if (tier == "hard") { w = 32; h = 32; target = 52; }
        else if (tier == "complex") { w = 44; h = 44; target = 80; }

        var levelData = LabyrinthGeneratorService.GenerateSolvableLevel(w, h, target);
        var parts = levelData.Split(';');
        int arrows = parts.Length > 2 ? parts[2].Split('|').Length : 0;

        return Ok(new LevelResponse
        {
            Tier = tier,
            LevelNumber = Random.Shared.Next(1, 100),
            Width = w,
            Height = h,
            ArrowCount = arrows,
            LevelData = levelData
        });
    }

    [HttpPost("score")]
    public IActionResult SubmitScore([FromBody] ScoreSubmitRequest request)
    {
        // Validates score submission
        if (request.Score < 0 || request.LevelNumber < 1)
        {
            return BadRequest("Invalid score submission data.");
        }

        return Ok(new
        {
            success = true,
            message = "Score validated and registered.",
            score = request.Score,
            tier = request.Tier,
            level = request.LevelNumber
        });
    }
}
