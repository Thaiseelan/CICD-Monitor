const Build = require("../models/Build");
const Log = require("../models/Log");

exports.handleWebhook = async (req, res) => {
  try {
    const payload = req.body;

    const repoName = payload.repository.name;
    const branch = payload.ref.split("/").pop();
    const commit = payload.head_commit;

    const newBuild = await Build.create({
      repositoryName: repoName,
      branch: branch,
      commitId: commit.id,
      message: commit.message,
      author: commit.author.name,
      status: "pending"
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
    await Log.create({
      buildId: buildId,
      message: `Build failed: ${error.message}`
    });
  }
}