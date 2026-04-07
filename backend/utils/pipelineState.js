const Pipeline = require("../models/Pipeline");

async function syncPipelineStatus({
  projectId,
  branch,
  status = "running",
  triggeredBy = "manual",
  lastBuildId,
  lastCommitId,
  lastRunAt,
}) {
  const update = {
    status,
    triggeredBy,
    lastRunAt: lastRunAt || new Date(),
  };

  if (lastBuildId) {
    update.lastBuildId = lastBuildId;
  }

  if (lastCommitId) {
    update.lastCommitId = lastCommitId;
  }

  return Pipeline.findOneAndUpdate(
    { project: projectId, branch },
    { $set: update, $setOnInsert: { project: projectId, branch } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      sort: { updatedAt: -1, createdAt: -1 },
    }
  );
}

module.exports = { syncPipelineStatus };
