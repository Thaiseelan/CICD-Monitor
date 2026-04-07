const express = require("express");
const router = express.Router();
const Build = require("../models/Build");
const Log = require("../models/Log");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authMiddleware = require("../middleware/authMiddleWare");
const {
  analyzePortfolio,
  analyzeBuildAgainstHistory,
} = require("../utils/intelligence");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateInsightWithGemini(prompt) {
  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
  ];
  let insightText = null;
  let lastErr = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel(
        { model: modelName },
        { apiVersion: "v1" }
      );
      const result = await model.generateContent(prompt);
      insightText =
        typeof result.response.text === "function"
          ? result.response.text()
          : result.response?.candidates?.[0]?.content || JSON.stringify(result);
      break;
    } catch (err) {
      lastErr = err;
      console.warn(`model ${modelName} failed:`, err?.message || err);
    }
  }

  return { insightText, lastErr };
}

router.get("/ai-overview", authMiddleware, async (req, res) => {
  try {
    const builds = await Build.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(80)
      .lean();

    const buildIds = builds.map((build) => build._id);
    const logs = await Log.find({ buildId: { $in: buildIds } })
      .sort({ timestamp: 1 })
      .lean();

    const logsByBuildId = logs.reduce((acc, log) => {
      const key = String(log.buildId);
      if (!acc[key]) acc[key] = [];
      acc[key].push(log);
      return acc;
    }, {});

    const overview = analyzePortfolio(builds, logsByBuildId);
    res.json(overview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI overview failed." });
  }
});

// Per-build AI insight: short, structured explanation
router.get("/ai-insights/:buildId", authMiddleware, async (req, res) => {
  try {
    const [build, allBuilds] = await Promise.all([
      Build.findById(req.params.buildId).lean(),
      Build.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(60).lean(),
    ]);
    if (!build) return res.status(404).json({ error: "Build not found" });
    if (String(build.user) !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const logs = await Log.find({ buildId: build._id })
      .sort({ timestamp: 1 })
      .lean();

    const logText =
      logs.length > 0
        ? logs.map((l) => `- ${l.message}`).join("\n")
        : "No logs available.";

    const localInsight = analyzeBuildAgainstHistory(build, allBuilds, logs);

    const prompt = `You are a senior DevOps engineer.
You will be given a single CI build and its logs.
Explain the issue in a very short, structured format.

Return your answer in EXACTLY this format:
Summary: <1 sentence high level summary>
Problem: <1-2 short sentences explaining what went wrong or what risk you see>
Solution: <1-3 very concrete actions to fix or improve>

Build:
- Repository: ${build.repositoryName}
- Branch: ${build.branch}
- Status: ${build.status}
- DurationMs: ${build.duration || 0}
- CommitMessage: ${build.message || "n/a"}

Logs:
${logText}

Historical heuristic assessment:
- Summary: ${localInsight.summary}
- Problem: ${localInsight.problem}
- Solution: ${localInsight.solution}
`;

    const fallbackInsight = [
      `Summary: ${localInsight.summary}`,
      `Problem: ${localInsight.problem}`,
      `Solution: ${localInsight.solution}`,
    ].join("\n");

    let source = "heuristic";
    let insightText = fallbackInsight;

    if (process.env.GEMINI_API_KEY) {
      const aiResult = await generateInsightWithGemini(prompt);
      if (aiResult.insightText) {
        insightText = aiResult.insightText;
        source = "gemini";
      } else {
        console.error("AI model calls failed for all candidates", aiResult.lastErr);
      }
    }

    res.json({
      insight: insightText,
      source,
      analysis: localInsight,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI analysis failed." });
  }
});

// Debug: list available models
router.get("/available-models", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'GEMINI_API_KEY not set' });

    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const resp = await fetch(url);
    const body = await resp.json();
    return res.json(body);
  } catch (err) {
    console.error('List models failed', err);
    return res.status(500).json({ error: 'List models failed', details: err?.message || String(err) });
  }
});

module.exports = router;
