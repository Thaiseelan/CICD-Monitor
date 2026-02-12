const express = require('express');
const router = express.Router();
const Pipeline = require('../models/Pipeline');
const Project = require('../models/Project');
const authMiddleware = require('../middleware/authMiddleWare');

// Create pipeline
router.post('/:projectId', authMiddleware, async (req, res) => {
  try {
    const { branch, triggeredBy } = req.body;

    // Find project
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Ownership check
    if (project.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const pipeline = await Pipeline.create({
      project: project._id,
      branch,
      triggeredBy: triggeredBy || "manual"
    });

    res.status(201).json(pipeline);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
