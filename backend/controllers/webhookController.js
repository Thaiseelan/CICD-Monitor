const Build = require("../models/Build");
const Log = require("../models/Log");
const Project = require("../models/Project");
const User = require("../models/User");
const { sendNotificationEmail } = require("../utils/notifications");
const { syncPipelineStatus } = require("../utils/pipelineState");

exports.handleWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const eventName = req.header("x-github-event") || req.header("x-gitlab-event") || "webhook";
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

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    if (eventName === "ping") {
      return res.status(200).json({
        message: "Webhook ping received",
        project: project.name,
      });
    }

    const repoName = payload.repository?.name || project.name;
    const branch =
      typeof payload.ref === "string"
        ? payload.ref.split("/").pop()
        : payload.repository?.default_branch || "main";
    const commit = payload.head_commit || null;
    const commitId =
      commit?.id ||
      (typeof payload.after === "string" && !/^0+$/.test(payload.after) ? payload.after : null);
    const author =
      commit?.author?.name ||
      payload.pusher?.name ||
      payload.user_name ||
      payload.sender?.login ||
      "webhook";
    const message = commit?.message || `${eventName} event received`;

    if (payload.deleted || !commitId) {
      return res.status(202).json({
        message: "Webhook received but no build was created for this event.",
        event: eventName,
      });
    }

    const newBuild = await Build.create({
      user: project.user,
      project: project._id,
      repositoryName: repoName,
      branch: branch,
      commitId,
      message,
      author,
      status: "pending"
    });

    await syncPipelineStatus({
      projectId: project._id,
      branch,
      status: "running",
      triggeredBy: author,
      lastBuildId: newBuild._id,
      lastCommitId: newBuild.commitId,
      lastRunAt: new Date(),
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

      if (step.status === "success" || step.status === "failed") {
        const project = await Project.findById(build.project);
        if (project) {
          const user = await User.findById(project.user);
          if (user) {
            const shouldNotify =
              (step.status === "success" && user.notifications.emailOnSuccess) ||
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
      await syncPipelineStatus({
        projectId: build.project,
        branch: build.branch,
        status: step.status,
        triggeredBy: build.author || "webhook",
        lastBuildId: build._id,
        lastCommitId: build.commitId,
        lastRunAt: step.status === "success" ? build.finishedAt : build.startedAt || new Date(),
      });

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
      await syncPipelineStatus({
        projectId: build.project,
        branch: build.branch,
        status: "failed",
        triggeredBy: build.author || "webhook",
        lastBuildId: build._id,
        lastCommitId: build.commitId,
        lastRunAt: build.finishedAt || new Date(),
      });

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
