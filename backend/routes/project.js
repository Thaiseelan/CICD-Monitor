const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const authMiddleware = require('../middleware/authMiddleWare');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const project = await Project.create({
      name: req.body.name,
      repoUrl: req.body.repoUrl,
      webhookBaseUrl: req.body.webhookBaseUrl || "http://localhost:5000",
      user: req.user.id
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.user.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    if (req.body.webhookBaseUrl !== undefined) project.webhookBaseUrl = req.body.webhookBaseUrl || "http://localhost:5000";
    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Ownership check
    if (project.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await project.deleteOne();

    res.json({ message: "Project deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
