const express = require("express");
const router = express.Router();
const Log = require("../models/Log");

router.get("/:buildId", async (req, res) => {
  const logs = await Log.find({
    buildId: req.params.buildId
  }).sort({ timestamp: 1 });

  res.json(logs);
});

module.exports = router;
