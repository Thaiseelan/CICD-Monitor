function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percent(part, total) {
  if (!total) return 0;
  return part / total;
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function classifyIssue(message = "") {
  const text = message.toLowerCase();

  if (/test|jest|vitest|mocha|assert|spec/.test(text)) return "tests";
  if (/npm|yarn|pnpm|package|module|dependency|install/.test(text)) return "dependencies";
  if (/timeout|timed out|hang|stuck|deadline/.test(text)) return "timeouts";
  if (/auth|token|credential|permission|forbidden|unauthor/i.test(text)) return "auth";
  if (/database|mongo|sql|prisma|connection refused/.test(text)) return "database";
  if (/lint|eslint|prettier|format|type error|typescript/.test(text)) return "quality";
  if (/docker|image|container|kubernetes|helm/.test(text)) return "infrastructure";
  if (/network|fetch|dns|socket|econn|enotfound/.test(text)) return "network";
  if (/build failed|syntax|compile|webpack|vite|babel/.test(text)) return "build";

  return "unknown";
}

function getStatusWeight(status) {
  if (status === "failed") return 1;
  if (status === "running") return 0.35;
  if (status === "pending") return 0.2;
  return 0;
}

function summarizeBuild(build, logs = []) {
  const issues = {};

  for (const log of logs) {
    const category = classifyIssue(log.message);
    issues[category] = (issues[category] || 0) + 1;
  }

  const dominantIssue = Object.entries(issues).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";
  const hasLogs = logs.length > 0;

  return {
    id: String(build._id),
    repositoryName: build.repositoryName,
    branch: build.branch,
    status: build.status,
    createdAt: build.createdAt,
    duration: build.duration || 0,
    dominantIssue,
    confidence: hasLogs ? "high" : "medium",
  };
}

function analyzePortfolio(builds, logsByBuildId = {}) {
  const orderedBuilds = [...builds].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const completedBuilds = orderedBuilds.filter(
    (build) => build.status === "success" || build.status === "failed"
  );
  const failedBuilds = completedBuilds.filter((build) => build.status === "failed");
  const recentBuilds = orderedBuilds.slice(0, 12);

  const durations = completedBuilds
    .map((build) => build.duration)
    .filter((value) => typeof value === "number" && value > 0);

  const baselineDuration = average(durations);
  const recentDurations = recentBuilds
    .map((build) => build.duration)
    .filter((value) => typeof value === "number" && value > 0);
  const recentAverageDuration = average(recentDurations);
  const failureRate = percent(failedBuilds.length, completedBuilds.length);
  const recentFailures = recentBuilds.filter((build) => build.status === "failed").length;
  const recentFailureRate = percent(
    recentFailures,
    recentBuilds.filter((build) => build.status === "success" || build.status === "failed").length
  );

  const repoRiskMap = new Map();
  const branchRiskMap = new Map();
  const issueCounts = {};
  const anomalies = [];

  for (const build of orderedBuilds) {
    const buildId = String(build._id);
    const logs = logsByBuildId[buildId] || [];
    const issue = summarizeBuild(build, logs).dominantIssue;
    issueCounts[issue] = (issueCounts[issue] || 0) + (build.status === "failed" ? 2 : 1);

    const repoKey = build.repositoryName || "unknown";
    const branchKey = `${build.repositoryName || "unknown"}:${build.branch || "unknown"}`;

    repoRiskMap.set(repoKey, (repoRiskMap.get(repoKey) || 0) + getStatusWeight(build.status));
    branchRiskMap.set(branchKey, (branchRiskMap.get(branchKey) || 0) + getStatusWeight(build.status));

    if (
      build.duration &&
      baselineDuration > 0 &&
      build.duration > baselineDuration * 1.35
    ) {
      anomalies.push({
        type: "duration-spike",
        severity: build.duration > baselineDuration * 1.75 ? "high" : "medium",
        buildId,
        repositoryName: build.repositoryName,
        branch: build.branch,
        message: `${build.repositoryName} on ${build.branch} ran ${Math.round(
          ((build.duration - baselineDuration) / baselineDuration) * 100
        )}% slower than its recent baseline.`,
      });
    }

    if (
      build.status === "failed" &&
      orderedBuilds
        .filter((item) => item.repositoryName === build.repositoryName && item.branch === build.branch)
        .slice(0, 3)
        .every((item) => item.status === "failed")
    ) {
      anomalies.push({
        type: "failure-streak",
        severity: "high",
        buildId,
        repositoryName: build.repositoryName,
        branch: build.branch,
        message: `${build.repositoryName} on ${build.branch} is in a repeated failure streak.`,
      });
    }
  }

  const topIssues = Object.entries(issueCounts)
    .filter(([issue]) => issue !== "unknown")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([issue, count]) => ({ issue, count }));

  const repoRisks = [...repoRiskMap.entries()]
    .map(([repositoryName, score]) => ({ repositoryName, riskScore: round(score, 2) }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const branchRisks = [...branchRiskMap.entries()]
    .map(([name, score]) => {
      const [repositoryName, branch] = name.split(":");
      return { repositoryName, branch, riskScore: round(score, 2) };
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const riskScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        recentFailureRate * 55 +
          (baselineDuration > 0 ? Math.min(recentAverageDuration / baselineDuration, 2) * 20 : 0) +
          Math.min(anomalies.length * 8, 25)
      )
    )
  );

  let riskLevel = "low";
  if (riskScore >= 70) riskLevel = "high";
  else if (riskScore >= 40) riskLevel = "medium";

  const recommendations = [];
  if (recentFailureRate >= 0.4) {
    recommendations.push("Stabilize the recent failing branch before merging more changes.");
  }
  if (recentAverageDuration > baselineDuration * 1.2 && baselineDuration > 0) {
    recommendations.push("Investigate the slowest stages and cache dependency installs or test artifacts.");
  }
  if (topIssues.some((issue) => issue.issue === "tests")) {
    recommendations.push("Add flaky test quarantine or rerun logic for unstable suites.");
  }
  if (topIssues.some((issue) => issue.issue === "dependencies")) {
    recommendations.push("Pin critical package versions and surface lockfile drift in pull requests.");
  }
  if (topIssues.some((issue) => issue.issue === "auth" || issue.issue === "network")) {
    recommendations.push("Audit secrets, API tokens, and network access for external CI dependencies.");
  }
  if (!recommendations.length) {
    recommendations.push("Pipeline health looks stable; focus on collecting richer logs for deeper root-cause analysis.");
  }

  const headline =
    riskLevel === "high"
      ? "Pipeline risk is elevated and needs intervention."
      : riskLevel === "medium"
        ? "Pipeline health is watchable with a few emerging risks."
        : "Pipeline health is stable with low immediate risk.";

  return {
    headline,
    risk: {
      score: riskScore,
      level: riskLevel,
      recentFailureRate: round(recentFailureRate * 100, 1),
      overallFailureRate: round(failureRate * 100, 1),
      baselineDurationMs: Math.round(baselineDuration),
      recentAverageDurationMs: Math.round(recentAverageDuration),
    },
    anomalies: anomalies.slice(0, 6),
    topIssues,
    repoRisks,
    branchRisks,
    recommendations,
  };
}

function analyzeBuildAgainstHistory(build, builds, logs = []) {
  const sameBranchBuilds = builds.filter(
    (item) =>
      item.repositoryName === build.repositoryName &&
      item.branch === build.branch &&
      String(item._id) !== String(build._id)
  );
  const recentSameBranch = sameBranchBuilds
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
  const sameBranchDurations = recentSameBranch
    .map((item) => item.duration)
    .filter((value) => typeof value === "number" && value > 0);
  const baselineDuration = average(sameBranchDurations);
  const dominantIssue = summarizeBuild(build, logs).dominantIssue;
  const previousFailures = recentSameBranch.filter((item) => item.status === "failed").length;

  const findings = [];
  if (build.status === "failed") {
    findings.push("The build finished in a failed state and should be prioritized.");
  }
  if (build.duration && baselineDuration > 0 && build.duration > baselineDuration * 1.25) {
    findings.push(
      `Execution time is ${Math.round(((build.duration - baselineDuration) / baselineDuration) * 100)}% slower than recent builds on this branch.`
    );
  }
  if (previousFailures >= 2) {
    findings.push("This branch has repeated recent failures, which suggests a systemic issue instead of a one-off run.");
  }
  if (dominantIssue !== "unknown") {
    findings.push(`Log patterns most strongly point to a ${dominantIssue} problem.`);
  }
  if (!findings.length) {
    findings.push("This build does not show strong warning signals beyond its current status.");
  }

  const actions = [];
  if (dominantIssue === "tests") actions.push("Inspect the failing test suite and rerun flaky cases with verbose output.");
  if (dominantIssue === "dependencies") actions.push("Review dependency installation logs and lockfile consistency.");
  if (dominantIssue === "auth") actions.push("Validate secrets, tokens, and permission scopes used by the pipeline.");
  if (dominantIssue === "network") actions.push("Check connectivity to external package registries or services.");
  if (dominantIssue === "build" || dominantIssue === "quality") {
    actions.push("Review recent source changes for compile, lint, or type-check regressions.");
  }
  if (!actions.length) {
    actions.push("Compare this run against the previous healthy build to isolate the first meaningful change.");
  }

  return {
    summary:
      build.status === "failed"
        ? `${build.repositoryName} on ${build.branch} failed with ${dominantIssue} as the most likely issue area.`
        : `${build.repositoryName} on ${build.branch} is ${build.status} with no major anomaly detected.`,
    problem: findings.join(" "),
    solution: actions.join(" "),
    dominantIssue,
    baselineDurationMs: Math.round(baselineDuration),
    previousFailures,
  };
}

module.exports = {
  analyzePortfolio,
  analyzeBuildAgainstHistory,
};
