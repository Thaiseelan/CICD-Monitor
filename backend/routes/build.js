const express = require("express");
const router = express.Router();
const Build = require("../models/Build");
const Log = require("../models/Log");
const Project = require("../models/Project");
const Pipeline = require("../models/Pipeline");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleWare");
const { sendNotificationEmail } = require("../utils/notifications");

async function simulateBuildPipeline(buildId) {
  const steps = [
    { delay: 2000, status: "running", logs: ["Cloning repository...", "Installing dependencies..."] },
    { delay: 5000, status: "success", logs: ["Running tests...", "Build successful."] }
  ];

  try {
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay));

      const build = await Build.findById(buildId);
      if (!build) return;

      build.status = step.status;
      if (step.status === "running") {
        build.startedAt = new Date();
      } else if (step.status === "success") {
        build.finishedAt = new Date();
        build.duration = build.finishedAt - build.startedAt;
      }
      await build.save();

      // Send notification if status is success or failed
      if (step.status === "success" || step.status === "failed") {
        const project = await Project.findById(build.project);
        if (project) {
          const user = await User.findById(project.user);
          if (user) {
            const shouldNotify = (step.status === "success" && user.notifications.emailOnSuccess) ||
                                 (step.status === "failed" && user.notifications.emailOnFailure);
            if (shouldNotify) {
              const subject = `Build ${step.status === "success" ? "Succeeded" : "Failed"} for ${build.repositoryName}`;
              const text = `Build Details:\n- Repository: ${build.repositoryName}\n- Branch: ${build.branch}\n- Status: ${step.status}\n- Duration: ${build.duration ? (build.duration / 1000).toFixed(2) + "s" : "N/A"}\n- Commit: ${build.message || "N/A"}`;
              await sendNotificationEmail(user.email, subject, text);
            }
          }
        }
      }

      // Update pipeline status too
      await Pipeline.updateOne(
        { project: build.project, branch: build.branch },
        { status: step.status },
        { sort: { createdAt: -1 } }
      );

      // Add logs
      for (const logMessage of step.logs) {
        await Log.create({
          buildId: build._id,
          message: logMessage
        });
      }
    }
  } catch (error) {
    console.error("Build pipeline error:", error);
    await Build.findByIdAndUpdate(buildId, { 
      status: "failed",
      finishedAt: new Date()
    });

    const build = await Build.findById(buildId);
    if (build) {
      await Pipeline.updateOne(
        { project: build.project, branch: build.branch },
        { status: "failed" },
        { sort: { createdAt: -1 } }
      );

      // Send failure notification
      const project = await Project.findById(build.project);
      if (project) {
        const user = await User.findById(project.user);
        if (user && user.notifications.emailOnFailure) {
          const subject = `Build Failed for ${build.repositoryName}`;
          const text = `Build Details:\n- Repository: ${build.repositoryName}\n- Branch: ${build.branch}\n- Status: failed\n- Error: ${error.message}`;
          await sendNotificationEmail(user.email, subject, text);
        }
      }
    }

    await Log.create({
      buildId: buildId,
      message: `Build failed: ${error.message}`
    });
  }
}

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

// GET single build
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const build = await Build.findById(req.params.id);
    if (!build) return res.status(404).json({ message: "Build not found" });
    if (build.user.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    res.json(build);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch build" });
  }
});

// POST manual build
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { projectId, branch, commitId, message } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.user.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    const newBuild = await Build.create({
      user: req.user.id,
      project: projectId,
      repositoryName: project.name,
      branch: branch || "main",
      commitId: commitId || "manual",
      message: message || "Manual build",
      author: "manual",
      status: "pending"
    });

    // Also create a pipeline record
    await Pipeline.create({
      project: projectId,
      branch: branch || "main",
      status: "running",
      triggeredBy: "manual"
    });

    res.status(201).json(newBuild);

    // Simulate build
    setTimeout(() => simulateBuildPipeline(newBuild._id), 1000);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
