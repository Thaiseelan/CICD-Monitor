const express = require("express");
const router = express.Router();
const Build = require("../models/Build");
const authMiddleware = require("../middleware/authMiddleWare");

// GET all builds
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, repo } = req.query;

    const filter = { user: req.user.id };

    if (status) filter.status = status;
    if (repo) filter.repositoryName = repo;

    const builds = await Build.find(filter)
      .sort({ createdAt: -1 });

    res.json(builds);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch builds" });
  }
});

module.exports = router;
