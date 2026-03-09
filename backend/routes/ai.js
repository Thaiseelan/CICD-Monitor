const express = require("express");
const router = express.Router();
const Build = require("../models/Build");
const Log = require("../models/Log");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authMiddleware = require("../middleware/authMiddleWare");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Per-build AI insight: short, structured explanation
router.get("/ai-insights/:buildId", authMiddleware, async (req, res) => {
  try {
    const build = await Build.findById(req.params.buildId);
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
`;

    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
    ];
    let insightText = null;
    let lastErr = null;

    for (const m of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: m }, { apiVersion: "v1" });
        const result = await model.generateContent(prompt);
        insightText =
          typeof result.response.text === "function"
            ? result.response.text()
            : result.response?.candidates?.[0]?.content || JSON.stringify(result);
        break;
      } catch (err) {
        lastErr = err;
        console.warn(`model ${m} failed:`, err?.message || err);
      }
    }

    if (!insightText) {
      console.error("AI model calls failed for all candidates", lastErr);
      return res.status(502).json({
        error: "No available generative model. Check API key / model availability.",
        details: lastErr?.message || String(lastErr),
      });
    }

    res.json({ insight: insightText });
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
