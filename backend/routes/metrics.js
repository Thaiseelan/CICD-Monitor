const express = require("express");
const router = express.Router();
const Build = require("../models/Build");
const authMiddleware = require("../middleware/authMiddleWare");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const builds = await Build.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100);

    const total = builds.length;
    const success = builds.filter((b) => b.status === "success").length;
    const failed = builds.filter((b) => b.status === "failed").length;
    const running = builds.filter((b) => b.status === "running").length;
    const pending = builds.filter((b) => b.status === "pending").length;

    const completed = success + failed;
    const failureRate = completed > 0 ? failed / completed : 0;

    const durations = builds
      .map((b) => b.duration)
      .filter((d) => typeof d === "number" && d > 0)
      .sort((a, b) => a - b);

    const avgDurationMs =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    const p95DurationMs =
      durations.length > 0
        ? durations[Math.floor(durations.length * 0.95) - 1] ||
          durations[durations.length - 1]
        : 0;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const buildsLastHour = builds.filter(
      (b) => b.createdAt && b.createdAt >= oneHourAgo
    ).length;
    const buildsLast24h = builds.filter(
      (b) => b.createdAt && b.createdAt >= dayAgo
    ).length;

    // Trends over last 6 builds (last 3 vs previous 3)
    let durationTrend = "insufficient-data";
    let failureTrend = "insufficient-data";
    let durationChangePct = 0;
    let failureChangePct = 0;

    if (builds.length >= 6) {
      const recent = builds.slice(0, 3);
      const previous = builds.slice(3, 6);

      const recentDur =
        recent
          .map((b) => b.duration)
          .filter((d) => typeof d === "number" && d > 0) || [];
      const prevDur =
        previous
          .map((b) => b.duration)
          .filter((d) => typeof d === "number" && d > 0) || [];

      const recentAvgDur =
        recentDur.length > 0
          ? recentDur.reduce((s, d) => s + d, 0) / recentDur.length
          : 0;
      const prevAvgDur =
        prevDur.length > 0
          ? prevDur.reduce((s, d) => s + d, 0) / prevDur.length
          : 0;

      if (prevAvgDur > 0) {
        durationChangePct = (recentAvgDur - prevAvgDur) / prevAvgDur;
        if (durationChangePct > 0.1) durationTrend = "increasing";
        else if (durationChangePct < -0.1) durationTrend = "decreasing";
        else durationTrend = "flat";
      }

      const recentCompleted = recent.filter(
        (b) => b.status === "success" || b.status === "failed"
      );
      const previousCompleted = previous.filter(
        (b) => b.status === "success" || b.status === "failed"
      );

      const recentFail =
        recentCompleted.filter((b) => b.status === "failed").length;
      const prevFail =
        previousCompleted.filter((b) => b.status === "failed").length;

      const recentFailRate =
        recentCompleted.length > 0
          ? recentFail / recentCompleted.length
          : 0;
      const prevFailRate =
        previousCompleted.length > 0
          ? prevFail / previousCompleted.length
          : 0;

      if (prevFailRate > 0) {
        failureChangePct = (recentFailRate - prevFailRate) / prevFailRate;
        if (failureChangePct > 0.1) failureTrend = "increasing";
        else if (failureChangePct < -0.1) failureTrend = "decreasing";
        else failureTrend = "flat";
      }
    }

    // Health score: 0–100
    // components: reliability (failure), speed (duration), activity (volume)
    let score = 100;

    const failurePenalty = clamp(failureRate * 120, 0, 65); // up to -65
    score -= failurePenalty;

    const targetDurationMs = 5 * 60 * 1000; // 5 minutes
    const durationRatio = targetDurationMs
      ? clamp(avgDurationMs / targetDurationMs, 0, 2)
      : 0;
    const durationPenalty = durationRatio * 25; // up to -25
    score -= durationPenalty;

    let activityBoost = 0;
    if (buildsLast24h >= 40) activityBoost = 10;
    else if (buildsLast24h >= 20) activityBoost = 7;
    else if (buildsLast24h >= 10) activityBoost = 4;
    else if (buildsLast24h >= 1) activityBoost = 2;

    score += activityBoost;
    score = clamp(Math.round(score), 0, 100);

    let grade = "C";
    let status = "warning";
    if (score >= 90) {
      grade = "A";
      status = "healthy";
    } else if (score >= 75) {
      grade = "B";
      status = "healthy";
    } else if (score >= 60) {
      grade = "C";
      status = "warning";
    } else if (score >= 40) {
      grade = "D";
      status = "critical";
    } else {
      grade = "F";
      status = "critical";
    }

    res.json({
      summary: {
        total,
        success,
        failed,
        running,
        pending,
      },
      metrics: {
        failureRate,
        avgDurationMs,
        p95DurationMs,
        buildsLastHour,
        buildsLast24h,
      },
      trends: {
        durationTrend,
        durationChangePct,
        failureTrend,
        failureChangePct,
      },
      health: {
        score,
        grade,
        status,
      },
    });
  } catch (err) {
    console.error("metrics failed", err);
    res.status(500).json({ error: "Failed to compute metrics" });
  }
});

module.exports = router;

