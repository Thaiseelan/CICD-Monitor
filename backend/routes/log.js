const express = require("express");
const router = express.Router();
const Log = require("../models/Log");
const Build = require("../models/Build");
const authMiddleware = require("../middleware/authMiddleWare");

router.get("/:buildId", authMiddleware, async (req, res) => {
  const build = await Build.findById(req.params.buildId);
  if (!build) return res.status(404).json({ message: "Build not found" });
  if (String(build.user) !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const logs = await Log.find({ buildId: req.params.buildId }).sort({
    timestamp: 1,
  });

  res.json(logs);
});

module.exports = router;
