const Build = require("../models/Build");
const Log = require("../models/Log");
const Project = require("../models/Project");
const Pipeline = require("../models/Pipeline");

exports.handleWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const webhookToken =
      req.params?.token ||
      req.header("x-webhook-token") ||
      req.query?.token ||
      null;

    if (!webhookToken) {
      return res.status(400).json({
        error:
          "Webhook token required. Use POST /api/webhook/:token or provide x-webhook-token header.",
      });
    }

    const project = await Project.findOne({ webhookToken });
    if (!project) {
      return res.status(404).json({ error: "Invalid webhook token" });
    }

    const repoName = payload.repository.name;
    const branch = payload.ref.split("/").pop();
    const commit = payload.head_commit;

    const newBuild = await Build.create({
      user: project.user,
      project: project._id,
      repositoryName: repoName,
      branch: branch,
      commitId: commit.id,
      message: commit.message,
      author: commit.author.name,
      status: "pending"
    });

    // Also create a pipeline record
    await Pipeline.create({
      project: project._id,
      branch: branch,
      status: "running",
      triggeredBy: commit.author.name || "webhook"
    });

    // Respond immediately
    res.status(200).json({ 
      message: "Webhook received",
      buildId: newBuild._id 
    });

    // Start build process
    simulateBuildPipeline(newBuild._id);

  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

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
    }

    await Log.create({
      buildId: buildId,
      message: `Build failed: ${error.message}`
    });
  }
}