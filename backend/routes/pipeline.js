const express = require('express');
const router = express.Router();
const Pipeline = require('../models/Pipeline');
const Project = require('../models/Project');
const authMiddleware = require('../middleware/authMiddleWare');
const { syncPipelineStatus } = require("../utils/pipelineState");

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

    const pipeline = await syncPipelineStatus({
      projectId: project._id,
      branch,
      status: "running",
      triggeredBy: triggeredBy || "manual",
      lastRunAt: new Date(),
    });

    res.status(200).json(pipeline);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all pipelines for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id }).select('_id');
    const projectIds = projects.map(p => p._id);

    const pipelines = await Pipeline.find({ project: { $in: projectIds } })
      .populate('project', 'name')
      .sort({ updatedAt: -1, createdAt: -1 });

    const uniquePipelines = [];
    const seen = new Set();

    for (const pipeline of pipelines) {
      const projectId = pipeline.project?._id?.toString?.() || pipeline.project?.toString?.();
      const key = `${projectId}:${pipeline.branch}`;

      if (!seen.has(key)) {
        seen.add(key);
        uniquePipelines.push(pipeline);
      }
    }

    res.json(uniquePipelines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
