const express = require("express");
const router = express.Router();
const Build = require("../models/Build");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/*
  Frontend AI card UI (where to add the AI card):
  - File: frontend/src/components/BuildTable.jsx
  - Component: BuildsTable (AI Insights card at the top of the component)
  - Data source: GET /api/ai-insights → returns { insight: string }
  
  Recommendation: call the endpoint from the frontend using the full backend URL
  during development (e.g. "http://localhost:5000/api/ai-insights") or configure
  a Vite proxy so you can use a relative "/api/ai-insights" path.
*/

router.get("/ai-insights", async (req, res) => {
  try {
    const builds = await Build.find().sort({ createdAt: -1 }).limit(10);

    if (builds.length === 0) {
      return res.json({ insight: "No build data available yet." });
    }

    const summary = builds.map((b, index) => {
      return `
Build ${index + 1}:
Repository: ${b.repositoryName}
Branch: ${b.branch}
Status: ${b.status}
Duration: ${b.duration || 0} ms
`;
    }).join("\n");

    const prompt = `
You are a DevOps AI assistant.
Analyze the following CI build history and provide:

1. Overall system health
2. Failure patterns
3. Duration trends
4. Suggestions if issues detected

Build History:
${summary}
`;

    const candidateModels = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];
    let insightText = null;
    let lastErr = null;

    for (const m of candidateModels) {
      try {
        
        const model = genAI.getGenerativeModel({ model: m }, { apiVersion: "v1" });
        const result = await model.generateContent(prompt);
        insightText = typeof result.response.text === "function" ? result.response.text() : (result.response?.candidates?.[0]?.content || JSON.stringify(result));
        break; // success
      } catch (err) {
        lastErr = err;
        console.warn(`model ${m} failed:`, err?.message || err);
      }
    }

    if (!insightText) {
      console.error("AI model calls failed for all candidates", lastErr);
      return res.status(502).json({ error: "No available generative model. Check API key / model availability.", details: lastErr?.message || String(lastErr) });
    }

    res.json({ insight: insightText });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI analysis failed." });
  }
});


router.get('/available-models', async (req, res) => {
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
